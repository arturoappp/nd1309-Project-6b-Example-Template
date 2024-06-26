// This script is designed to test the solidity smart contract - SuppyChain.sol -- and the various functions within
// Declare a variable and assign the compiled smart contract artifact
var SupplyChain = artifacts.require('SupplyChain')

contract('SupplyChain', function(accounts) {
    // Declare few constants and assign a few sample accounts generated by ganache-cli
    var sku = 1
    var upc = 1
    const ownerID = accounts[0]
    const originFarmerID = accounts[1]
    const originFarmName = "John Doe"
    const originFarmInformation = "Yarray Valley"
    const originFarmLatitude = "-38.239770"
    const originFarmLongitude = "144.341490"
    var productID = sku + upc
    const productNotes = "Best beans for Espresso"
    const productPrice = web3.utils.toWei("1", "ether")
    var itemState = 0
    const distributorID = accounts[2]
    const retailerID = accounts[3]
    const consumerID = accounts[4]
    const emptyAddress = '0x00000000000000000000000000000000000000'

    ///Available Accounts
    ///==================
    // (0) 0x87d97bc8d22fca8bb0ebbe34cf7494de61f38b13
    // (1) 0x310750c35345b542a602dbe4e503f88bbd2b72d3
    // (2) 0x06a564240dd116421de22c14ddf5a9d36061b73b
    // (3) 0x29d1c8488d2c497e308fe5299ca24dada4ad2fc5
    // (4) 0x2d1d5a51ccc1b74c34565fc33a1167f37ff56253
    // (5) 0x014b48bb8464b9e6322b0ca00219e743d094212c
    // (6) 0x08262ac536a34dbe9721b3790df2259965a5b5ec
    // (7) 0x008099dab396785b36b30bc3099e0ba8b0fb40f4
    // (8) 0x3010e3cdcbd9deb11356c2f88d35a6d76996c936
    // (9) 0x0e4eee00dca7433b2a1de5a6238c91faf2ee84cf

    console.log("ganache-cli accounts used here...")
    console.log("Contract Owner: accounts[0] ", accounts[0])
    console.log("Farmer: accounts[1] ", accounts[1])
    console.log("Distributor: accounts[2] ", accounts[2])
    console.log("Retailer: accounts[3] ", accounts[3])
    console.log("Consumer: accounts[4] ", accounts[4])


    // Helper function to assert event emission
    async function assertEvent(transaction, eventName) {
        const { logs } = await transaction;
        const event = logs.find(log => log.event === eventName);
        assert.exists(event, `Event ${eventName} was not emitted`);
        return event;
    }

    // 1st Test
    it("Testing smart contract function harvestItem() that allows a farmer to harvest coffee", async() => {
        const supplyChain = await SupplyChain.deployed()
        await supplyChain.addFarmer(originFarmerID);

        // Mark an item as Harvested by calling function harvestItem()
        let tx = await supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: originFarmerID});

        // Watch the emitted event ForSale
        await assertEvent(tx, 'Harvested');

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc)
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc)

        // Verify the result set
        assert.equal(resultBufferOne[0], sku, 'Error: Invalid item SKU')
        assert.equal(resultBufferOne[1], upc, 'Error: Invalid item UPC')
        assert.equal(resultBufferOne[2], originFarmerID, 'Error: Missing or Invalid ownerID')
        assert.equal(resultBufferOne[3], originFarmerID, 'Error: Missing or Invalid originFarmerID')
        assert.equal(resultBufferOne[4], originFarmName, 'Error: Missing or Invalid originFarmName')
        assert.equal(resultBufferOne[5], originFarmInformation, 'Error: Missing or Invalid originFarmInformation')
        assert.equal(resultBufferOne[6], originFarmLatitude, 'Error: Missing or Invalid originFarmLatitude')
        assert.equal(resultBufferOne[7], originFarmLongitude, 'Error: Missing or Invalid originFarmLongitude')
        assert.equal(resultBufferTwo[5], 0, 'Error: Invalid item State')
    })

    // 2nd Test
    it("Testing smart contract function processItem() that allows a farmer to process coffee", async() => {
        const supplyChain = await SupplyChain.deployed()

        // Prepare by ensuring the item is first harvested
        await supplyChain.harvestItem(upc, originFarmerID, "John Doe Farm", "Yarray Valley", "-38.239770", "144.341490", "Best beans for Espresso", {from: originFarmerID});

        // Mark an item as Processed by calling function processItem()
        let tx = await supplyChain.processItem(upc, {from: originFarmerID});

        // Watch the emitted event Processed()
        assert.equal(tx.logs[0].event, 'Processed', 'Processed event should be emitted');

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc);

        // Verify the result set
        // Ensure indices are correctly adjusted according to your contract's return values
        assert.equal(resultBufferOne[2], originFarmerID, 'Error: The originFarmerID does not match');
        assert.equal(resultBufferOne[5], "Yarray Valley", 'Error: Invalid item State for Processed'); // Make sure this index corresponds to the state in your contract
    })

    // 3rd Test
    it("Testing smart contract function packItem() that allows a farmer to pack coffee", async() => {
        const supplyChain = await SupplyChain.deployed();

        // Assume item is already processed; this should be handled in separate tests or setup

        // Declare and Initialize a variable for event
        var eventEmitted = false;

        // Mark an item as Packed by calling function packItem()
        let tx = await supplyChain.packItem(upc, {from: originFarmerID});

        // Check for the emitted event 'Packed'
        if (tx.logs[0].event === "Packed") {
            eventEmitted = true;
        }

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

        // Verify the result set
        assert.equal(resultBufferTwo[5], 2, 'Error: Invalid item State for Packed'); // Assuming index 5 is state
        assert.equal(eventEmitted, true, 'Invalid event emitted');
    });

    // 4th Test
    it("Testing smart contract function sellItem() that allows a farmer to sell coffee", async() => {
        const supplyChain = await SupplyChain.deployed();

        // Prepare by ensuring the item is harvested, processed, and packed before it can be sold
        await supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: originFarmerID});
        await supplyChain.processItem(upc, {from: originFarmerID});
        await supplyChain.packItem(upc, {from: originFarmerID});

        // Mark an item as ForSale by calling function sellItem()
        let tx = await supplyChain.sellItem(upc, productPrice, {from: originFarmerID});

        // Watch the emitted event ForSale
        await assertEvent(tx, 'ForSale');

        // Retrieve the just now saved item from blockchain by calling function fetchItemBufferTwo()
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

        // Verify the result set
        assert.equal(resultBufferTwo[5], 3, 'Error: Invalid item State for For Sale'); // Assuming index 5 is state
        assert.equal(resultBufferTwo[4], productPrice, 'Error: Product price not set correctly');
    })

    // 5th Test
    it("Testing smart contract function buyItem() that allows a distributor to buy coffee", async() => {
        const supplyChain = await SupplyChain.deployed();
        await supplyChain.addDistributor(distributorID);

        // Assuming item is already for sale; this should have been handled in a separate test or setup
        await supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: originFarmerID});
        await supplyChain.processItem(upc, {from: originFarmerID});
        await supplyChain.packItem(upc, {from: originFarmerID});
        await supplyChain.sellItem(upc, productPrice, {from: originFarmerID});

        // Mark an item as Sold by calling function buyItem()
        let tx = await supplyChain.buyItem(upc, {from: distributorID, value: productPrice});

        // Watch the emitted event Shipped
        await assertEvent(tx, 'Sold');

        // Retrieve the just now saved item from blockchain by calling function fetchItemBufferTwo()
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

        // Verify the result set
        assert.equal(resultBufferTwo[5], 4, 'Error: Invalid item State for Sold'); // Assuming index 5 is state
        assert.equal(resultBufferTwo[6], distributorID, 'Error: Distributor ID not set correctly');
        assert.equal(resultBufferTwo[4], productPrice, 'Error: Product price not set correctly');
        console.log(resultBufferTwo[4])
        console.log(productPrice)
        console.log(resultBufferTwo)
    })


    // 6th Test
    it("Testing smart contract function shipItem() that allows a distributor to ship coffee", async() => {
        const supplyChain = await SupplyChain.deployed();

        // Preparing the item through previous stages to reach the Sold state
        await supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: originFarmerID});
        await supplyChain.processItem(upc, {from: originFarmerID});
        await supplyChain.packItem(upc, {from: originFarmerID});
        await supplyChain.sellItem(upc, productPrice, {from: originFarmerID});
        await supplyChain.buyItem(upc, {from: distributorID, value: productPrice});

        // Mark an item as Shipped by calling function shipItem()
        let tx = await supplyChain.shipItem(upc, {from: distributorID});

        // Watch the emitted event Shipped
        await assertEvent(tx, 'Shipped');

        // Retrieve the just now saved item from blockchain by calling function fetchItemBufferTwo()
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

        // Verify the result set
        assert.equal(resultBufferTwo[5], 5, 'Error: Invalid item State for Shipped'); // Assuming index 5 is state
    })

    // 7th Test
    it("Testing smart contract function receiveItem() that allows a retailer to mark coffee received", async() => {
        const supplyChain = await SupplyChain.deployed();
        await supplyChain.addRetailer(retailerID);

        // Preparing the item through previous stages to reach the Shipped state
        await supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: originFarmerID});
        await supplyChain.processItem(upc, {from: originFarmerID});
        await supplyChain.packItem(upc, {from: originFarmerID});
        await supplyChain.sellItem(upc, productPrice, {from: originFarmerID});
        await supplyChain.buyItem(upc, {from: distributorID, value: productPrice});
        await supplyChain.shipItem(upc, {from: distributorID});

        // Assume retailerID is set correctly in the item details as part of the shipping process
        // Mark an item as Received by calling function receiveItem()
        try {
            console.log(`here ***************************** receiveItem ${accounts[3]} *********************************************`)
            let tx = await supplyChain.receiveItem(upc, {from: retailerID});
            console.log("here ***************************** receiveItem *********************************************")
            assert(tx, "Transaction should complete without error.");

            // Verify event emission
            assert.equal(tx.logs[0].event, 'Received', 'Received event should be emitted.');

            // Retrieve the just now saved item from blockchain by calling function fetchItemBufferTwo()
            const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);
            console.log(resultBufferTwo)

            // Verify the result set
            assert.equal(resultBufferTwo[5], 6, 'Error: Invalid item State for Received'); // Assuming index 5 is state
            assert.equal(resultBufferTwo[7], retailerID, 'Error: Retailer ID not correctly set as ownerID');
        } catch (error) {
            assert.fail("Failed to receive item: " + error.message);
        }
    });

    // 8th Test
    it("Testing smart contract function purchaseItem() that allows a consumer to purchase coffee", async() => {
        const supplyChain = await SupplyChain.deployed();
        await supplyChain.addConsumer(consumerID);

        // Preparing the item through previous stages
        await supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: originFarmerID});
        await supplyChain.processItem(upc, {from: originFarmerID});
        await supplyChain.packItem(upc, {from: originFarmerID});
        await supplyChain.sellItem(upc, productPrice, {from: originFarmerID});
        await supplyChain.buyItem(upc, {from: distributorID, value: productPrice});
        await supplyChain.shipItem(upc, {from: distributorID});
        await supplyChain.receiveItem(upc, {from: retailerID});

        // Mark an item as Purchased by calling function purchaseItem()
        let tx = await supplyChain.purchaseItem(upc, {from: consumerID, value: productPrice});

        // Watch the emitted event Purchased
        await assertEvent(tx, 'Purchased');

        // Retrieve the just now saved item from blockchain by calling function fetchItemBufferTwo()
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

        // Verify the result set
        assert.equal(resultBufferTwo[5], 7, 'Error: Invalid item State for Purchased');
        assert.equal(resultBufferTwo[8], consumerID, 'Error: Consumer ID not correctly set');
    })

    // 9th Test
    it("Testing smart contract function fetchItemBufferOne() that allows anyone to fetch item details from blockchain", async() => {
        const supplyChain = await SupplyChain.deployed();

        // Ensure the item is created and has gone through initial steps if needed
        await supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: originFarmerID});
        await supplyChain.processItem(upc, {from: originFarmerID});
        await supplyChain.packItem(upc, {from: originFarmerID});

        // Retrieve the just now saved item from blockchain by calling function fetchItemBufferOne()
        const result = await supplyChain.fetchItemBufferOne.call(upc);

        console.log(result)

        // Verify the result set
        assert.equal(result[0].toNumber(), 8, 'Error: Invalid item SKU');
        assert.equal(result[1].toNumber(), upc, 'Error: Invalid item UPC');
        assert.equal(result[2], originFarmerID, 'Error: Missing or Invalid ownerID');
        assert.equal(result[3], originFarmerID, 'Error: Missing or Invalid originFarmerID');
        assert.equal(result[4], originFarmName, 'Error: Missing or Invalid originFarmName');
        assert.equal(result[5], originFarmInformation, 'Error: Missing or Invalid originFarmInformation');
        assert.equal(result[6], originFarmLatitude, 'Error: Missing or Invalid originFarmLatitude');
        assert.equal(result[7], originFarmLongitude, 'Error: Missing or Invalid originFarmLongitude');
    });

    // 10th Test
    it("Testing smart contract function fetchItemBufferTwo() that allows anyone to fetch item details from blockchain", async() => {
        const supplyChain = await SupplyChain.deployed();

        // Ensure the item is created and has gone through initial steps if needed
        await supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes, {from: originFarmerID});
        await supplyChain.processItem(upc, {from: originFarmerID});
        await supplyChain.packItem(upc, {from: originFarmerID});
        await supplyChain.sellItem(upc, productPrice, {from: originFarmerID});
        await supplyChain.buyItem(upc, {from: distributorID, value: productPrice});
        await supplyChain.shipItem(upc, {from: distributorID});
        await supplyChain.receiveItem(upc, {from: retailerID});
        await supplyChain.purchaseItem(upc, {from: consumerID, value: productPrice});

        // Retrieve the just now saved item from blockchain by calling function fetchItemBufferTwo()
        const result = await supplyChain.fetchItemBufferTwo.call(upc);

        // Verify the result set
        assert.equal(result[0], 9, 'Error: Invalid item SKU');
        assert.equal(result[1], upc, 'Error: Invalid item UPC');
        assert.equal(result[3], productNotes, 'Error: Incorrect product notes');
        assert.equal(result[4], productPrice, 'Error: Incorrect product price');
        assert.equal(result[5], 7, 'Error: Incorrect item State');
        assert.equal(result[6], distributorID, 'Error: Incorrect distributor ID');
        assert.equal(result[7], retailerID, 'Error: Incorrect retailer ID');
        assert.equal(result[8], consumerID, 'Error: Incorrect consumer ID');
    });

});

