const FarmerRole = artifacts.require('FarmerRole');

contract('FarmerRole', function(accounts) {
    const [admin, farmer, nonFarmer] = accounts;

    beforeEach(async function () {
        this.contract = await FarmerRole.new({from: admin});
    });

    describe('managing farmers', function () {
        it('should allow adding a farmer', async function () {
            await this.contract.addFarmer(farmer, {from: admin});
            const hasRole = await this.contract.isFarmer(farmer);
            assert.equal(hasRole, true);
        });

        it('should allow removing a farmer', async function () {
            await this.contract.addFarmer(farmer, {from: admin});
            await this.contract.renounceFarmer({from: farmer});
            const hasRole = await this.contract.isFarmer(farmer);
            assert.equal(hasRole, false);
        });

        it('should emit an event when a new farmer is added', async function () {
            const result = await this.contract.addFarmer(farmer, {from: admin});
            assert.equal(result.logs[0].event, 'FarmerAdded');
        });

        it('should emit an event when a farmer is removed', async function () {
            await this.contract.addFarmer(farmer, {from: admin});
            const result = await this.contract.renounceFarmer({from: farmer});
            assert.equal(result.logs[0].event, 'FarmerRemoved');
        });
    });
});
