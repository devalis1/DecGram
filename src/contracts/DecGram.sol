pragma solidity ^0.8.11;

contract DecGram {
  string public name = "DecGram";

  // Store Images
  uint public imageCount = 0;
  mapping(uint => Image) public images;

  struct Image {
    uint id;
    string hash;
    string description;
    uint tipAmount;
    address author;
  }

  event ImageCreated (
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address author
  );

  event ImageTipped (
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address author
  );
  
  // Create Images
  function uploadImage(string memory _imgHash, string memory _description) public {
    
    // Require to make sure image values exists
    // description exists 
    require(bytes(_description).length > 0);
    // Hash exists
    require(bytes(_imgHash).length > 0);
    // address exists
    require(msg.sender != address(0x0));

    // increment image id
    imageCount ++;

    // add image to contract
    images[imageCount] = Image(imageCount, _imgHash, _description, 0, msg.sender);

    // trigger an event
    emit ImageCreated(imageCount, _imgHash, _description, 0, msg.sender);
  }

  // Tip Images
  function tipImageOwner(uint _id) public payable {

    // Make sure id is valid
    require (_id > 0 && _id <= imageCount);

    // fetch the image
    Image memory _image = images[_id];

    // fetch the author
    address _author = _image.author;

    // Pay the author by sending them Ether
    payable(_author).transfer(msg.value);

    // Increment tip ammount
    _image.tipAmount = _image.tipAmount + msg.value;
    
    // Update the image
    images[_id] = _image;

    // Trigger an event
    emit ImageTipped(_id, _image.hash, _image.description, _image.tipAmount, _author);
  }
}