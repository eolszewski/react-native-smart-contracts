import React from 'react';
import SimpleStorageContract from '../../build/contracts/SimpleStorage.json';
import IDTokenContract from '../../build/contracts/IDToken.json';
import CreditTokenContract from '../../build/contracts/CreditToken.json';
import OrganizationMultiSigWalletContract from '../../build/contracts/OrganizationMultiSigWallet.json';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, TextInput, ScrollView } from 'react-native';
import { Card, ListItem, Button } from 'react-native-elements'

const contract = require('truffle-contract');
const simpleStorage = contract(SimpleStorageContract);
const IDToken = contract(IDTokenContract);
const CreditToken = contract(CreditTokenContract);
const OrgWallet = contract(OrganizationMultiSigWalletContract);

export default class Home extends React.Component {
  static navigationOptions = {
    tabBarLabel: 'Home',
  };
  constructor() {
    super();

    this.state = {
      storageValue: 0,
      pendingStorageValue: 0,
      accounts: [],
      simpleStorageInstance: null,
      address: null
    };

    this.updateStorageValue = this.updateStorageValue.bind(this);
  }

  componentWillReceiveProps(props) {
    console.log('props: ', props);
    if (props && props.screenProps && props.screenProps.web3) {
      this.setState({
        storageValue: 0,
        pendingStorageValue: 0,
        simpleStorageInstance: null,
        IDTokenInstance: null,
        CreditTokenInstance: null,
        OrgWalletInstance: null
      });

      this.instantiateContracts(props.screenProps.web3);
    }
  }

  async instantiateContracts(web3) {
    console.log('web3: ', web3);
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */
    simpleStorage.setProvider(web3.currentProvider);
    IDToken.setProvider(web3.currentProvider);
    CreditToken.setProvider(web3.currentProvider);
    OrgWallet.setProvider(web3.currentProvider);

    // Declaring this for later so we can chain functions on SimpleStorage.
    let simpleStorageInstance, OrgWalletInstance, IDTokenInstance, CreditTokenInstance;

    try {
      simpleStorageInstance = await simpleStorage.at('0x79e61576cd28c0dd4d634539f380d84a8ae2bce3');
      let storageValue = await simpleStorageInstance.get.call();
      this.setState({ simpleStorageInstance, storageValue: storageValue.toString(10) });
    } catch (error) {
      console.log(error);
    }

    try {
      OrgWalletInstance = await OrgWallet.at('0x26514c9baf3d1f782ab9d8204b5068a70a1a9b42');
      this.setState({ OrgWalletInstance });
    } catch (error) {
      console.log(error);
    }

    try {
      IDTokenInstance = await IDToken.at('0x789138a2eac5e8a8042390e239f7bb449cb4a760');
      this.setState({ IDTokenInstance });
    } catch (error) {
      console.log(error);
    }

    try {
      CreditTokenInstance = await CreditToken.at('0x9327066cb015e733e8ba3d89e778855ef0a519b5');
      this.setState({ CreditTokenInstance });
    } catch (error) {
      console.log(error);
    }
  }

  async updateStorageValue() {
    this.setState({ loading: true });
    let { simpleStorageInstance, pendingStorageValue} = this.state;
    let { address } = this.props.screenProps;
    let storageValue = await simpleStorageInstance.get.call({from: address});
    this.setState({ storageValue: storageValue.c[0] });  

    await simpleStorageInstance.set(pendingStorageValue, {from: address});
    storageValue = await simpleStorageInstance.get.call({from: address});

    // Update state with the result.
    this.setState({ storageValue: storageValue.c[0], loading: false });  
  }

  render() {
    return (
      <ScrollView>
        <Card>
          <Text>Your Truffle Box is installed and ready.</Text>  
        </Card>
        <Card title="Simple storage">
          <Text>The stored value is: {this.state.storageValue}</Text>
          <Text>Current Address: {this.props.screenProps.address}</Text>
        </Card>
        <Card>
          <TextInput
            style={{ height: 40 }}
            placeholder="Enter the new storage value!"
            onChangeText={(value) => this.setState({ pendingStorageValue: value })}
          />
          {
            this.state.loading ?
              (<ActivityIndicator
                animating={this.state.loading}
                style={styles.activityIndicator} />) :
              (<Button
                onPress={this.updateStorageValue}
                title="Update Storage Value"
                accessibilityLabel="Update the storage value!"
              />)
          }
        </Card>
        {/* <Card>
          <TextInput
            style={{ height: 40 }}
            placeholder="Enter the new storage value!"
            onChangeText={(address) => this.setState({ address })}
          />
          {
            this.state.loading ?
              (<ActivityIndicator
                animating={this.state.loading}
                style={styles.activityIndicator} />) :
              (<Button
                onPress={this.addAdmin}
                title="Add agent to organization"
                accessibilityLabel="Update the storage value!"
              />)
          }
        </Card> */}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40
  }
});
