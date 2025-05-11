import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Workshop, FooToken } from '../typechain-types';

describe('Workshop Unit Tests', function () {
  async function deployWorkshopFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy FooToken first (as Workshop needs an ERC20 token)
    const FooTokenFactory = await ethers.getContractFactory('FooToken');
    const fooToken = await FooTokenFactory.deploy(owner.address);
    
    const tokenAddress = await fooToken.getAddress();

    // Deploy Workshop with FooToken address
    const WorkshopFactory = await ethers.getContractFactory('Workshop');
    const workshop = await WorkshopFactory.deploy(tokenAddress);

    return { workshop, fooToken, owner, user1, user2 };
  }

  describe('Deployment', function() {
    it('Should set the token address correctly', async function() {
      const { workshop, fooToken } = await loadFixture(deployWorkshopFixture);
      
      const workshopToken = await workshop.token();
      const fooTokenAddress = await fooToken.getAddress();
      
      expect(workshopToken).to.equal(fooTokenAddress);
    });

    it('Should set constants correctly', async function() {
      const { workshop } = await loadFixture(deployWorkshopFixture);
      
      const maxFooNameLen = await workshop.MAX_FOO_NAME_LEN();
      const minFooNameLen = await workshop.MIN_FOO_NAME_LEN();
      
      expect(maxFooNameLen).to.equal(255);
      expect(minFooNameLen).to.equal(1);
    });
  });

  describe('#addBar', function() {
    it('Should add a bar successfully', async function() {
      const { workshop, user1 } = await loadFixture(deployWorkshopFixture);
      
      const name = "Test Bar";
      const telemetry = true;
      const luckyNumbers = [5, 6, 7, 8] as [number, number, number, number];
      
      await expect(workshop.connect(user1).addBar(name, telemetry, luckyNumbers))
        .to.emit(workshop, 'BarCreated')
        .withArgs(name, telemetry, luckyNumbers, user1.address);
      
      // Verify bar was added
      const bars = await workshop.getBars();
      expect(bars.length).to.equal(1);
    });

    it('Should revert when name is too short', async function() {
      const { workshop } = await loadFixture(deployWorkshopFixture);
      
      const name = ""; // Empty name, too short
      const telemetry = true;
      const luckyNumbers = [5, 6, 7, 8] as [number, number, number, number];
      
      await expect(workshop.addBar(name, telemetry, luckyNumbers))
        .to.be.revertedWithCustomError(workshop, "NameLengthError")
        .withArgs("The name length must be in the range", 1, 255);
    });

    it('Should allow multiple users to add bars', async function() {
      const { workshop, user1, user2 } = await loadFixture(deployWorkshopFixture);
      
      // User 1 adds a bar
      await workshop.connect(user1).addBar("User1 Bar", true, [1, 2, 3, 4] as [number, number, number, number]);
      
      // User 2 adds a bar
      await workshop.connect(user2).addBar("User2 Bar", false, [5, 6, 7, 8] as [number, number, number, number]);
      
      // Verify both bars were added
      const bars = await workshop.getBars();
      expect(bars.length).to.equal(2);
    });
  });

  describe('#getBars', function() {
    it('Should return empty array when no bars exist', async function() {
      const { workshop } = await loadFixture(deployWorkshopFixture);
      
      const bars = await workshop.getBars();
      expect(bars.length).to.equal(0);
    });

    it('Should return all bars when they exist', async function() {
      const { workshop, user1 } = await loadFixture(deployWorkshopFixture);
      
      // Add multiple bars
      await workshop.connect(user1).addBar("Bar 1", true, [1, 2, 3, 4] as [number, number, number, number]);
      await workshop.connect(user1).addBar("Bar 2", false, [5, 6, 7, 8] as [number, number, number, number]);
      
      // Get all bars
      const bars = await workshop.getBars();
      expect(bars.length).to.equal(2);
    });
  });

  describe('#getBarFoos', function() {
    it('Should return the foos for a specific bar', async function() {
      const { workshop, user1 } = await loadFixture(deployWorkshopFixture);
      
      // Add a bar
      await workshop.connect(user1).addBar("Test Bar", true, [1, 2, 3, 4] as [number, number, number, number]);
      
      // Get foos for the bar
      const foos = await workshop.getBarFoos(0);
      expect(foos.length).to.equal(1);
      expect(foos[0].name).to.equal("Test Bar");
      expect(foos[0].telemetry).to.be.true;
      expect(foos[0].status).to.equal(1); // Status.StepOne
    });
  });

  describe('#getBarFoo', function() {
    it('Should return a specific foo from a specific bar', async function() {
      const { workshop, user1 } = await loadFixture(deployWorkshopFixture);
      
      // Add a bar
      await workshop.connect(user1).addBar("Test Bar", true, [1, 2, 3, 4] as [number, number, number, number]);
      
      // Get specific foo
      const foo = await workshop.getBarFoo(0, 0);
      expect(foo.name).to.equal("Test Bar");
      expect(foo.telemetry).to.be.true;
      expect(foo.status).to.equal(1); // Status.StepOne
      expect(foo.luckyNumbers[0]).to.equal(1);
      expect(foo.luckyNumbers[1]).to.equal(2);
      expect(foo.luckyNumbers[2]).to.equal(3);
      expect(foo.luckyNumbers[3]).to.equal(4);
    });

    it('Should revert when trying to access nonexistent bar', async function() {
      const { workshop } = await loadFixture(deployWorkshopFixture);
      
      // Try to access nonexistent bar
      await expect(workshop.getBarFoo(0, 0)).to.be.reverted;
    });
  });

  describe('Edge Cases', function() {
    it('Should handle name at minimum length', async function() {
      const { workshop } = await loadFixture(deployWorkshopFixture);
      
      const name = "A"; // Minimum length
      await expect(workshop.addBar(name, true, [1, 2, 3, 4] as [number, number, number, number]))
        .to.emit(workshop, 'BarCreated');
    });

    it('Should revert when constructor is called with non-contract address', async function() {
      const [owner] = await ethers.getSigners();
      const WorkshopFactory = await ethers.getContractFactory('Workshop');
      
      await expect(WorkshopFactory.deploy(owner.address)) // Using an EOA, not a contract
        .to.be.revertedWith("Address must be a Contract Address");
    });

    it('Should handle many bars being added', async function() {
      const { workshop, user1 } = await loadFixture(deployWorkshopFixture);
      
      // Add multiple bars (5 for this test)
      for (let i = 0; i < 5; i++) {
        await workshop.connect(user1).addBar(`Bar ${i}`, i % 2 === 0, [i, i+1, i+2, i+3] as [number, number, number, number]);
      }
      
      // Verify all bars were added
      const bars = await workshop.getBars();
      expect(bars.length).to.equal(5);
      
      // Check the IDs are sequential
      for (let i = 0; i < 5; i++) {
        expect(bars[i].barId).to.equal(i);
      }
    });
  });
});
