pragma solidity ^0.4.21;

import './IDToken.sol';
import './CreditToken.sol';
import './DateTime.sol';

contract OrganizationMultiSigWallet {

    /*
     *  Events
     */
    event Confirmation(address indexed sender, uint indexed transactionId);
    event Revocation(address indexed sender, uint indexed transactionId);
    event Submission(uint indexed transactionId);
    event Execution(uint indexed transactionId);
    event ExecutionFailure(uint indexed transactionId);
    event Deposit(address indexed sender, uint value);
    event AgentAddition(address indexed agent);
    event AdminAddition(address indexed admin);
    event AgentRemoval(address indexed agent);
    event AdminRemoval(address indexed admin);
    event RequirementChange(uint required);

    /*
     *  Storage
     */

    mapping(uint => Transaction) public transactions;
    uint public transactionsCount;
    mapping(uint => mapping(address => bool)) public confirmations;
    mapping(address => bool) public isAgent; // wallet owner that is agent
    mapping(address => bool) public isAdmin; // wallet owner that is admin
    mapping(address => Spendings) public spentToday;
    address[] public admins;
    address[] public agents;
    string public name; // organization name
    address public IDTokenAddress;
    address public CreditTokenAddress;
    address public rootOwner;
    uint public required; // number of confirmations
    uint public dailyLimitEth;
    uint public dailyLimitIDToken;
    uint public dailyLimitCreditToken;
    uint public lastDay; //timestamp

    enum ValueTypes {Eth, ID, Credit}

    struct Transaction {
        address sender;
        address destination;
        uint value;
        ValueTypes valueType;
        bool executed;
    }

    struct Spendings {
        uint spentEth;
        uint spentIDToken;
        uint spentCreditToken;
    }

    /*
     *  Modifiers
     */
    modifier onlyWallet() {
        require(msg.sender == address(this));
        _;
    }

    modifier onlyRootOwner() {
        require(msg.sender == rootOwner);
        _;
    }

    modifier onlyRootOwnerOrAdmin() {
        require(msg.sender == rootOwner || isAdmin[msg.sender]);
        _;
    }

    modifier onlyWalletOwner() {
        require(isWalletOwner(msg.sender));
        _;
    }

    modifier onlyAgent() {
        require(isAgent[msg.sender]);
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender]);
        _;
    }

    modifier adminDoesNotExist(address admin) {
        require(!isAdmin[admin]);
        _;
    }

    modifier adminExists(address admin) {
        require(isAdmin[admin]);
        _;
    }

    modifier agentDoesNotExist(address agent) {
        require(!isAgent[agent]);
        _;
    }

    modifier agentExists(address agent) {
        require(isAgent[agent]);
        _;
    }


    modifier ownerDoesNotExist(address owner) {
        require(!isWalletOwner(owner));
        _;
    }

    modifier ownerExists(address owner) {
        require(isWalletOwner(owner));
        _;
    }


    modifier transactionExists(uint transactionId) {
        require(transactions[transactionId].destination != 0);
        _;
    }

    modifier confirmed(uint transactionId, address owner) {
        require(confirmations[transactionId][owner]);
        _;
    }

    modifier notConfirmed(uint transactionId, address owner) {
        require(!confirmations[transactionId][owner]);
        _;
    }

    modifier notExecuted(uint transactionId) {
        require(!transactions[transactionId].executed);
        _;
    }

    modifier notNull(address _address) {
        require(_address != 0);
        _;
    }

    modifier validRequirement(uint ownerCount, uint _required) {
        require(_required <= ownerCount
        && _required != 0
        && ownerCount != 0);
        _;
    }

    modifier limitNotReached(address sender, uint value, ValueTypes valueType) {
        updateDailyLimits();
        // check limits
        if (isAgent[sender]) {
            if (valueType == ValueTypes.Eth) require((spentToday[sender].spentEth + value) <= dailyLimitEth);
            if (valueType == ValueTypes.ID) require((spentToday[sender].spentIDToken + value) <= dailyLimitIDToken);
            if (valueType == ValueTypes.Credit) require((spentToday[sender].spentCreditToken + value) <= dailyLimitCreditToken);
        }
        _;
    }

    /// @dev Fallback function allows to deposit ether.
    function() public payable
    {
        if (msg.value > 0)
            emit Deposit(msg.sender, msg.value);
    }


    /*
     * Public functions
     */

    /// @dev Set limits to zero for agents if a new day has come
    function updateDailyLimits() public {
        if (now > (lastDay + 24 hours)) {
            // set today 00:00 as current day
            lastDay = DateTime.toTimestamp(DateTime.getYear(now), DateTime.getMonth(now), DateTime.getDay(now));
            // update all agents
            for (uint i = 0; i < agents.length; i++) {
                spentToday[agents[i]] = Spendings({
                    spentEth : 0,
                    spentIDToken : 0,
                    spentCreditToken : 0
                    });
            }
        }
    }

    function isWalletOwner(address owner)
    public
    view
    returns (bool)
    {
        return (owner == rootOwner || isAdmin[owner] || isAgent[owner]);
    }

    function getWalletOwnersCount()
    public
    view
    returns (uint)
    {
        return uint(admins.length + agents.length + 1);
    }

    constructor(string _name, uint _dailyLimitEth, uint _dailyLimitIDToken, uint _dailyLimitCreditToken, address _IDTokenAddress, address _CreditTokenAddress)
    public
    {
        //admins.push(msg.sender);
        required = uint(1);
        rootOwner = msg.sender;
        name = _name;
        dailyLimitEth = _dailyLimitEth;
        dailyLimitIDToken = _dailyLimitIDToken;
        dailyLimitCreditToken = _dailyLimitCreditToken;
        IDTokenAddress = _IDTokenAddress;
        CreditTokenAddress = _CreditTokenAddress;
    }

    function setDailyLimit(uint value, ValueTypes valueType)
    public
    onlyRootOwner
    {
        if (valueType == ValueTypes.Eth) dailyLimitEth = value;
        if (valueType == ValueTypes.ID) dailyLimitIDToken = value;
        if (valueType == ValueTypes.Credit) dailyLimitCreditToken = value;

    }

    function addAdmin(address admin)
    public
    onlyRootOwner
    adminDoesNotExist(admin)
    notNull(admin)
    {
        isAdmin[admin] = true;
        admins.push(admin);
        emit AdminAddition(admin);
    }

    function addAgent(address agent)
    public
    onlyRootOwnerOrAdmin
    agentDoesNotExist(agent)
    notNull(agent)
    {
        isAgent[agent] = true;
        agents.push(agent);
        emit AgentAddition(agent);
    }

    function removeAdmin(address admin)
    public
    onlyRootOwner
    adminExists(admin)
    {
        isAdmin[admin] = false;

        for (uint i = 0; i < admins.length; i++)
            if (admins[i] == admin) {
                admins[i] = admins[admins.length - 1];
                break;
            }
        if (admins.length > 0) admins.length -= 1;
        if (required > getWalletOwnersCount())
            changeRequirement(getWalletOwnersCount());
        emit AdminRemoval(admin);
    }

    function removeAgent(address agent)
    public
    onlyRootOwnerOrAdmin
    agentExists(agent)
    {
        isAgent[agent] = false;
        for (uint i = 0; i < agents.length; i++)
            if (agents[i] == agent) {
                agents[i] = agents[agents.length - 1];
                break;
            }
        if (agents.length > 0) agents.length -= 1;
        if (required > getWalletOwnersCount())
            changeRequirement(getWalletOwnersCount());
        emit AgentRemoval(agent);
    }

    /// @dev Allows to change the number of required confirmations. Transaction has to be sent by wallet.
    /// @param _required Number of required confirmations.
    function changeRequirement(uint _required)
    public
    onlyWallet
    validRequirement(getWalletOwnersCount(), _required)
    {
        required = _required;
        emit RequirementChange(_required);
    }


    /// @dev Allows an owner to add and confirm (send) a transaction.
    /// @param destination Transaction target address.
    /// @param value Transaction value.
    /// @param valueType Transaction value type (Eth, ID, Credit).
    /// @return Returns transaction ID.
    function submitTransaction(address destination, uint value, ValueTypes valueType)
    public
    onlyWalletOwner
    limitNotReached(msg.sender, value, valueType)
    returns (uint transactionId)
    {
        transactionId = addTransaction(msg.sender, destination, value, valueType);
        //confirmTransaction(transactionId);// who can confirm. admins?
        executeTransactionWithoutConfirmations(transactionId);
        // add used limits
        if (isAgent[msg.sender]) {
            if (valueType == ValueTypes.Eth) spentToday[msg.sender].spentEth += value;
            if (valueType == ValueTypes.ID) spentToday[msg.sender].spentIDToken += value;
            if (valueType == ValueTypes.Credit) spentToday[msg.sender].spentCreditToken += value;
        }
    }

    function executeTransactionWithoutConfirmations(uint transactionId)
    internal
    ownerExists(msg.sender)
    transactionExists(transactionId)
    notExecuted(transactionId)
    {
        Transaction storage txn = transactions[transactionId];
        txn.executed = true;
        if (txn.valueType == ValueTypes.Eth) {
            //if (external_call(txn.destination, txn.value, 0, ""))
            txn.destination.transfer(txn.value);
            emit Execution(transactionId);
        } else {//tokens
            if (txn.valueType == ValueTypes.ID) {
                IDToken(IDTokenAddress).transfer(txn.destination, txn.value);
                emit Execution(transactionId);
            } else if (txn.valueType == ValueTypes.Credit) {
                CreditToken(CreditTokenAddress).transfer(txn.destination, txn.value);
                emit Execution(transactionId);
            } else {
                txn.executed = true;
                emit ExecutionFailure(transactionId);
            }
        }
    }


    /*
    /// @dev Allows an owner to confirm a transaction.
    /// @param transactionId Transaction ID.
    function confirmTransaction(uint transactionId)
    public
    ownerExists(msg.sender)
    transactionExists(transactionId)
    notConfirmed(transactionId, msg.sender)
    {
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);
        executeTransaction(transactionId);
    }

    /// @dev Allows an owner to revoke a confirmation for a transaction.
    /// @param transactionId Transaction ID.
    function revokeConfirmation(uint transactionId)
    public
    ownerExists(msg.sender)
    confirmed(transactionId, msg.sender)
    notExecuted(transactionId)
    {
        confirmations[transactionId][msg.sender] = false;
        emit Revocation(msg.sender, transactionId);
    }

    /// @dev Allows anyone to execute a confirmed transaction.
    /// @param transactionId Transaction ID.
    function executeTransaction(uint transactionId)
    public
    ownerExists(msg.sender)
    confirmed(transactionId, msg.sender)
    notExecuted(transactionId)
    {
        if (isConfirmed(transactionId)) {
            Transaction storage txn = transactions[transactionId];
            txn.executed = true;
            if (external_call(txn.destination, txn.value, txn.data.length, txn.data))
                emit Execution(transactionId);
            else {
                emit ExecutionFailure(transactionId);
                txn.executed = false;
            }
        }
    }
*
    // call has been separated into its own function in order to take advantage
    // of the Solidity's code generator to produce a loop that copies tx.data into memory.
    function external_call(address destination, uint value, uint dataLength, bytes data) private returns (bool) {
        bool result;
        assembly {
            let x := mload(0x40)   // "Allocate" memory for output (0x40 is where "free memory" pointer is stored by convention)
            let d := add(data, 32) // First 32 bytes are the padded length of data, so exclude that
            result := call(
            sub(gas, 34710), // 34710 is the value that solidity is currently emitting
            // It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
            // callNewAccountGas (25000, in case the destination address does not exist and needs creating)
            destination,
            value,
            d,
            dataLength, // Size of the input (in bytes) - this is what fixes the padding problem
            x,
            0                  // Output is ignored, therefore the output size is zero
            )
        }
        return result;
    }

    /*
        /// @dev Returns the confirmation status of a transaction.
        /// @param transactionId Transaction ID.
        /// @return Confirmation status.
        function isConfirmed(uint transactionId)
        public
        constant
        returns (bool)
        {
            uint count = 0;
            for (uint i = 0; i < walletOwners.length; i++) { // who can confirm. admins?
                if (confirmations[transactionId][walletOwners[i]])
                    count += 1;
                if (count == required)
                    return true;
            }
        }
    */
    /*
     * Internal functions
     */
    /// @dev Adds a new transaction to the transaction mapping, if transaction does not exist yet.
    /// @param _destination Transaction target address.
    /// @param _value Transaction value.
    /// @param _type Transaction value type.
    /// @return Returns transaction ID.
    function addTransaction(address _sender, address _destination, uint _value, ValueTypes _type)
    internal
    notNull(_destination)
    returns (uint transactionId)
    {
        transactionId = transactionsCount;
        transactions[transactionId] = Transaction({
            sender : _sender,
            destination : _destination,
            value : _value,
            valueType : _type,
            executed : false
            });
        transactionsCount += 1;
        emit Submission(transactionId);
    }

    /*
     * Web3 call functions
     *
    /// @dev Returns number of confirmations of a transaction.
    /// @param transactionId Transaction ID.
    /// @return Number of confirmations.
    function getConfirmationCount(uint transactionId)
    public
    constant
    returns (uint count)
    {
        for (uint i = 0; i < walletOwners.length; i++)
            if (confirmations[transactionId][walletOwners[i]])
                count += 1;
    }
*/
    /// @dev Returns total number of transactions after filers are applied.
    /// @param pending Include pending transactions.
    /// @param executed Include executed transactions.
    /// @return Total number of transactions after filters are applied.
    function getTransactionsCount(bool pending, bool executed)
    public
    view
    returns (uint count)
    {
        for (uint i = 0; i < transactionsCount; i++)
            if (pending && !transactions[i].executed
            || executed && transactions[i].executed)
                count += 1;
    }

    function getAdmins()
    public
    view
    returns (address[])
    {
        return admins;
    }

    function getAgents()
    public
    view
    returns (address[])
    {
        return agents;
    }

    /*
    /// @dev Returns array with owner addresses, which confirmed transaction.
    /// @param transactionId Transaction ID.
    /// @return Returns array of owner addresses.
    function getConfirmations(uint transactionId)
    public
    constant
    returns (address[] _confirmations)
    {
        address[] memory confirmationsTemp = new address[](walletOwners.length);
        uint count = 0;
        uint i;
        for (i = 0; i < walletOwners.length; i++)
            if (confirmations[transactionId][walletOwners[i]]) {
                confirmationsTemp[count] = walletOwners[i];
                count += 1;
            }
        _confirmations = new address[](count);
        for (i = 0; i < count; i++)
            _confirmations[i] = confirmationsTemp[i];
    }
*/
    /// @dev Returns list of transaction IDs in defined range.
    /// @param from Index start position of transaction array.
    /// @param to Index end position of transaction array.
    /// @param pending Include pending transactions.
    /// @param executed Include executed transactions.
    /// @return Returns array of transaction IDs.
    function getTransactionIds(uint from, uint to, bool pending, bool executed)
    public
    view
    returns (uint[] _transactionIds)
    {
        uint[] memory transactionIdsTemp = new uint[](transactionsCount);
        uint count = 0;
        uint i;
        for (i = 0; i < transactionsCount; i++)
            if (pending && !transactions[i].executed
            || executed && transactions[i].executed)
            {
                transactionIdsTemp[count] = i;
                count += 1;
            }
        _transactionIds = new uint[](to - from);
        for (i = from; i < to; i++)
            _transactionIds[i - from] = transactionIdsTemp[i];
    }
}