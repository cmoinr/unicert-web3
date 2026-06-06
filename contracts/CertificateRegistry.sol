// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CertificateRegistry
 * @dev Registrador oficial e inmutable de certificados académicos universitarios.
 * Cada certificado es un NFT único (ERC-721) no transferible (soulbound).
 * Basado en OpenZeppelin (ERC721 + Ownable + Pausable + ReentrancyGuard).
 */
contract CertificateRegistry is ERC721, Ownable, Pausable, ReentrancyGuard {

    using Strings for uint256;

    struct Certificate {
        string id;
        string recipientName;
        string eventName;
        uint256 issueDate;
        address issuer;
        bool isValid;
    }

    uint256 private _nextTokenId;

    mapping(string => uint256) private idToTokenId;
    mapping(uint256 => Certificate) private certificates;
    string[] public certificateIds;

    event CertificateIssued(
        uint256 indexed tokenId,
        string indexed id,
        string recipientName,
        string eventName,
        uint256 issueDate,
        address indexed issuer
    );
    event CertificateRevoked(uint256 indexed tokenId, string indexed id);
    event BatchIssued(uint256 count);

    constructor() ERC721("UniCert Web3", "UCERT") Ownable(msg.sender) {}

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: los certificados no son transferibles");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Registra un nuevo certificado en la blockchain como NFT soulbound.
     */
    function issueCertificate(
        string calldata _id,
        string calldata _recipientName,
        string calldata _eventName,
        uint256 _issueDate
    ) external onlyOwner whenNotPaused nonReentrant returns (uint256) {
        require(bytes(_id).length > 0, "El ID no puede estar vacio");
        require(bytes(_recipientName).length > 0, "El nombre del alumno no puede estar vacio");
        require(bytes(_eventName).length > 0, "El nombre del evento no puede estar vacio");
        require(idToTokenId[_id] == 0, "Este ID de certificado ya esta registrado");

        uint256 tokenId = ++_nextTokenId;

        _safeMint(msg.sender, tokenId);

        certificates[tokenId] = Certificate({
            id: _id,
            recipientName: _recipientName,
            eventName: _eventName,
            issueDate: _issueDate,
            issuer: msg.sender,
            isValid: true
        });

        idToTokenId[_id] = tokenId;
        certificateIds.push(_id);

        emit CertificateIssued(tokenId, _id, _recipientName, _eventName, _issueDate, msg.sender);

        return tokenId;
    }

    /**
     * @dev Emite multiples certificados en una sola transacción (batch minting).
     */
    function batchIssueCertificates(
        string[] calldata _ids,
        string[] calldata _recipientNames,
        string[] calldata _eventNames,
        uint256[] calldata _issueDates
    ) external onlyOwner whenNotPaused nonReentrant {
        uint256 length = _ids.length;
        require(length > 0, "Debe proporcionar al menos un certificado");
        require(length == _recipientNames.length, "Longitud de nombres no coincide");
        require(length == _eventNames.length, "Longitud de eventos no coincide");
        require(length == _issueDates.length, "Longitud de fechas no coincide");

        for (uint256 i = 0; i < length; i++) {
            require(bytes(_ids[i]).length > 0, string.concat("ID vacio en la posicion ", i.toString()));
            require(bytes(_recipientNames[i]).length > 0, string.concat("Nombre vacio en la posicion ", i.toString()));
            require(bytes(_eventNames[i]).length > 0, string.concat("Evento vacio en la posicion ", i.toString()));
            require(idToTokenId[_ids[i]] == 0, string.concat("ID duplicado: ", _ids[i]));

            uint256 tokenId = ++_nextTokenId;

            _safeMint(msg.sender, tokenId);

            certificates[tokenId] = Certificate({
                id: _ids[i],
                recipientName: _recipientNames[i],
                eventName: _eventNames[i],
                issueDate: _issueDates[i],
                issuer: msg.sender,
                isValid: true
            });

            idToTokenId[_ids[i]] = tokenId;
            certificateIds.push(_ids[i]);

            emit CertificateIssued(tokenId, _ids[i], _recipientNames[i], _eventNames[i], _issueDates[i], msg.sender);
        }

        emit BatchIssued(length);
    }

    /**
     * @dev Devuelve el tokenId asociado a un ID de certificado.
     */
    function getTokenIdByCertId(string calldata _id) external view returns (uint256) {
        uint256 tokenId = idToTokenId[_id];
        require(tokenId != 0, "ID de certificado no encontrado");
        return tokenId;
    }

    /**
     * @dev Revoca un certificado (lo marca como invalido).
     */
    function revokeCertificate(string calldata _id) external onlyOwner whenNotPaused {
        uint256 tokenId = idToTokenId[_id];
        require(tokenId != 0, "El certificado no existe");
        require(certificates[tokenId].isValid, "El certificado ya se encuentra inhabilitado");

        certificates[tokenId].isValid = false;

        emit CertificateRevoked(tokenId, _id);
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
            bool isValid,
            uint256 tokenId
        )
    {
        uint256 _tokenId = idToTokenId[_id];
        require(_tokenId != 0, "Certificado no encontrado en la blockchain");
        Certificate memory cert = certificates[_tokenId];
        return (
            cert.id,
            cert.recipientName,
            cert.eventName,
            cert.issueDate,
            cert.issuer,
            cert.isValid,
            _tokenId
        );
    }

    /**
     * @dev Devuelve los detalles de un certificado dado su tokenId.
     */
    function getCertificateByTokenId(uint256 _tokenId)
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
        require(_ownerOf(_tokenId) != address(0), "Token no existe");
        Certificate memory cert = certificates[_tokenId];
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
        uint256 tokenId = idToTokenId[_id];
        return tokenId != 0 && certificates[tokenId].isValid;
    }

    /**
     * @dev Devuelve el número total de certificados emitidos.
     */
    function totalCertificates() external view returns (uint256) {
        return certificateIds.length;
    }

    /**
     * @dev Devuelve el último tokenId acuñado.
     */
    function currentTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Pausa el contrato (solo owner).
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
