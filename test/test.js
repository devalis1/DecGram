const { assert } = require('chai')
const { default: Web3 } = require('web3')

const DecGram = artifacts.require('./DecGram.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('DecGram', ([deployer, author, tipper]) => {
  let decGram

  before(async () => {
    decGram = await DecGram.deployed()
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await decGram.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await decGram.name()
      assert.equal(name, 'DecGram')
    })
  })

  // Test Images
  describe('images', async () => {
    let result, imageCount
    const hash = 'abc123'

    before(async () => {
      result = await decGram.uploadImage(hash, 'Image Description', { from: author });
      imageCount = await decGram.imageCount()
    })

    it('creates images', async () => {
      // Success
      assert.equal(imageCount, 1)
      const event = result.logs[0].args
      
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(event.hash, hash, 'hash is correct')
      assert.equal(event.description, 'Image Description', 'description is correct')
      assert.equal(event.tipAmount, '0', 'tip Amount is correct')
      assert.equal(event.author, author, 'author is correct')

      // Failure: image must have hash
      await decGram.uploadImage('', 'Image Description', { from: author }).should.be.rejected;
      // Failure: image must have hash
      await decGram.uploadImage('Image hash', '', { from: author }).should.be.rejected;
    }) 

    // Check form Struct
    it('lists images', async () => {
      const image = await decGram.images(imageCount)
      assert.equal(image.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(image.hash, hash, 'hash is correct')
      assert.equal(image.description, 'Image Description', 'description is correct')
      assert.equal(image.tipAmount, '0', 'tip Amount is correct')
      assert.equal(image.author, author, 'author is correct')
    })

    it('allows to tip images', async () => {
      // Track the author balance before purchase
      let oldAuthorBalance
      oldAuthorBalance = await web3.eth.getBalance(author)
      oldAuthorBalance = new web3.utils.BN(oldAuthorBalance)

      result = await decGram.tipImageOwner(imageCount, { from: tipper, value: web3.utils.toWei('1', 'Ether')})

      // Success
      const event = result.logs[0].args
      
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(event.hash, hash, 'hash is correct')
      assert.equal(event.description, 'Image Description', 'description is correct')
      assert.equal(event.tipAmount, '1000000000000000000', 'tip Amount is correct')
      assert.equal(event.author, author, 'author is correct')

      // Check that author received funds
      let newAuthorBalance
      newAuthorBalance = await web3.eth.getBalance(author)
      newAuthorBalance = new web3.utils.BN(newAuthorBalance)

      let tipImageOwner
      tipImageOwner = await web3.utils.toWei('1', 'Ether')
      tipImageOwner = new web3.utils.BN(tipImageOwner)

      const expectedBalance = oldAuthorBalance.add(tipImageOwner)

      assert.equal(newAuthorBalance.toString(), expectedBalance.toString())

      // Failure
      await decGram.tipImageOwner(99, { from: tipper, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
    })
  })
})