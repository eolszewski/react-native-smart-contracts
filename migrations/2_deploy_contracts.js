const EventStoreLib = artifacts.require('./EventStoreLib.sol');
const EventStore = artifacts.require('./EventStore.sol');
const EventStoreFactory = artifacts.require('./EventStoreFactory.sol');

const SimpleStorage = artifacts.require('./SimpleStorage.sol');

module.exports = deployer => {
  deployer.deploy(EventStoreLib);
  deployer.link(EventStoreLib, EventStore);
  deployer.deploy(EventStore);
  deployer.link(EventStoreLib, EventStoreFactory);
  deployer.link(EventStore, EventStoreFactory);
  deployer.deploy(EventStoreFactory);

  deployer.deploy(SimpleStorage);
};
