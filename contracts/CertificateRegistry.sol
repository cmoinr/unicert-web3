// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CertificateRegistry
 * @dev Registrador oficial e inmutable de certificados académicos universitarios.
 * Basado en OpenZeppelin (Ownable + Pausable + ReentrancyGuard) para máxima seguridad.
 */
contract CertificateRegistry is Ownable, Pausable, ReentrancyGuard {
    
    struct Certificate {
        string id;
        string recipientName;
        string eventName;
        uint256 issueDate;
        address issuer;
        bool isValid;
    }
    
    mapping(string => Certificate) private certificates;
    string[] public certificateIds;
    
    event CertificateIssued(
        string indexed id, 
        string recipientName, 
        string eventName, 
        uint256 issueDate, 
        address indexed issuer
    );
    event CertificateRevoked(string indexed id);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Registra un nuevo certificado en la blockchain.
     */
    function issueCertificate(
        string calldata _id,
        string calldata _recipientName,
        string calldata _eventName,
        uint256 _issueDate
    ) external onlyOwner whenNotPaused nonReentrant {
        require(bytes(_id).length > 0, "El ID no puede estar vacio");
        require(bytes(_recipientName).length > 0, "El nombre del alumno no puede estar vacio");
        require(bytes(_eventName).length > 0, "El nombre del evento no puede estar vacio");
        require(certificates[_id].issuer == address(0), "Este ID de certificado ya esta registrado");
        
        certificates[_id] = Certificate({
            id: _id,
            recipientName: _recipientName,
            eventName: _eventName,
            issueDate: _issueDate,
            issuer: msg.sender,
            isValid: true
        });
        
        certificateIds.push(_id);
        
        emit CertificateIssued(_id, _recipientName, _eventName, _issueDate, msg.sender);
    }
    
    /**
     * @dev Permite revocar un certificado en caso de error o fraude.
     */
    function revokeCertificate(string calldata _id) external onlyOwner whenNotPaused {
        require(certificates[_id].issuer != address(0), "El certificado no existe");
        require(certificates[_id].isValid, "El certificado ya se encuentra inhabilitado");
        
        certificates[_id].isValid = false;
        
        emit CertificateRevoked(_id);
    }
    
    /**
     * @dev Devuelve los detalles de un certificado dado su ID.
     */
    function getCertificate(string calldata _id) 
        external 
        view 
        returns (
            string memory id,
            string memory recipientName,
            string memory eventName,
            uint256 issueDate,
            address issuer,
            bool isValid
        ) 
    {
        Certificate memory cert = certificates[_id];
        require(cert.issuer != address(0), "Certificado no encontrado en la blockchain");
        return (
            cert.id,
            cert.recipientName,
            cert.eventName,
            cert.issueDate,
            cert.issuer,
            cert.isValid
        );
    }
    
    /**
     * @dev Comprueba rápidamente si un certificado existe y es válido.
     */
    function isCertificateValid(string calldata _id) external view returns (bool) {
        return certificates[_id].issuer != address(0) && certificates[_id].isValid;
    }
    
    /**
     * @dev Devuelve el número total de certificados emitidos.
     */
    function totalCertificates() external view returns (uint256) {
        return certificateIds.length;
    }
    
    /**
     * @dev Pausa el contrato (solo owner). Detiene emisión/revocación en caso de emergencia.
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Reanuda el contrato (solo owner).
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
