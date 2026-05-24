// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @dev Registrador oficial e inmutable de certificados académicos universitarios.
 * Permite a la universidad firmar y registrar la validez de certificados en la blockchain,
 * y a cualquiera consultarlos de forma libre y transparente.
 */
contract CertificateRegistry {
    
    // Propietario del contrato (la Universidad)
    address public owner;
    
    // Estructura de datos para almacenar el certificado
    struct Certificate {
        string id;
        string recipientName;
        string eventName;
        uint256 issueDate; // Timestamp de emisión
        address issuer;    // Dirección de la entidad emisora
        bool isValid;      // Permite inhabilitar certificados en caso de error administrativo
    }
    
    // Mapeo para buscar certificados por su ID único
    mapping(string => Certificate) private certificates;
    
    // Lista de IDs emitidos para auditoría/consulta (opcional pero didáctico)
    string[] public certificateIds;
    
    // Eventos para auditar transacciones en la red
    event CertificateIssued(
        string indexed id, 
        string recipientName, 
        string eventName, 
        uint256 issueDate, 
        address indexed issuer
    );
    event CertificateRevoked(string indexed id);
    
    // Modificador de seguridad
    modifier onlyOwner() {
        require(msg.sender == owner, "Solo la entidad emisora autorizada (Universidad) puede realizar esta accion");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Registra un nuevo certificado en la blockchain.
     * @param _id Identificador único del certificado (por ejemplo, un UUID o número correlativo).
     * @param _recipientName Nombre del alumno egresado.
     * @param _eventName Nombre del foro o evento académico.
     * @param _issueDate Timestamp de la fecha del evento.
     */
    function issueCertificate(
        string calldata _id,
        string calldata _recipientName,
        string calldata _eventName,
        uint256 _issueDate
    ) external onlyOwner {
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
     * @param _id Identificador único del certificado.
     */
    function revokeCertificate(string calldata _id) external onlyOwner {
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
}
