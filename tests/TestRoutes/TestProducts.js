const chai = require('chai');
const assert =  require('chai').assert;
const chaiHttp = require('chai-http');
const app = require('../../server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const mongoose = require('mongoose');

const User = require('../../models/User');
const Product = require('../../models/Product');
// Configure chai
chai.use(chaiHttp);
chai.should();

let aProduct = new Product({
  name: "Guitarra",
  price: 50,
  isForSale: true,
});
aProduct
  .save()
  .then(product => {return product})
  .catch(err => console.log(err))

let anotherProduct = new Product({
  name: "Banjo",
  price: 50,
  isForSale: true,
});
anotherProduct
  .save()
  .then(product => {return anotherProduct})
  .catch(err => console.log(err))

const testUser = new User({
  name: "TestUserSeller",
  email: "testjwt@user.com",
  password: "TestPass",
  products: [ aProduct, anotherProduct],
});


bcrypt.genSalt(10, (err, salt) => {
  bcrypt.hash(testUser.password, salt, (err, hash) =>{
    if (err) throw err;
    testUser.password = hash;
    testUser
      .save()
      .then(user => {return user})
      .catch(err => console.log(err))
  });
});


const testBuyerUser = new User({
  name: "TestUserBuyer",
  email: "testuser@buyer.com",
  password: "BuyerPass",
  products: [],
});

bcrypt.genSalt(10, (err, salt) => {
  if (err) throw err;
  bcrypt.hash(testBuyerUser.password, salt, (err, hash) =>{
    if (err) throw err;
    testBuyerUser.password = hash;
    testBuyerUser
      .save()
      .then(user => {return user})
      .catch(err => console.log(err))
  });
});

/* No auth required */
describe("GET /api/products/all", () => {
  it("Should return all products", (done) => {
    chai.request(app)
      .get('/api/products/all')
      .end((err,res) => {
        if (err) return err;
        res.should.have.status(200);
        res.body.products.should.be.an('array');
        done();
      });
  });
});

/* No auth required */
describe("GET /api/products/detail/:id", () => {
  it("Should return one product", (done) => {
    chai.request(app)
      .get(`/api/products/detail/${aProduct._id}`)
      .end((err,res) => {
        if (err) return err;
        res.should.have.status(200);
        assert.equal(aProduct.name, res.body.product.name);
        assert.equal(aProduct.price, res.body.product.price);
        assert.equal(aProduct.isForSale, res.body.product.isForSale);
        done();
      });
  });
  it("Should require valid Mongo Id", (done) => {
    chai.request(app)
      .get('/api/products/detail/1234')
      .end((err,res) => {
        if (err) return err;
        res.should.have.status(400);
        res.body.should.be.a('object');
        assert.equal(res.body.error.product_error,"Product Id is required");
        done()
      });
  });
});

/* Auth required */
describe("GET / user products", () => {
  let token;
  before((done) => {
    chai.request(app)
      .post('/api/users/login')
      .send({
        email: "testjwt@user.com",
        password: "TestPass",
      })
      .end((err,res) => {
        if (err) return err;
        token = res.body.token;
        done();
      });
  });
  it("Should require authorization", (done) => {
    chai.request(app)
      .get('/api/products/')
      .end((err,res) => {
        if (err) return err;
        res.should.have.status(401);
        done();
      });
  });
  it("Should return user's products", (done) => {
    chai.request(app)
      .get('/api/products/')
      .set({'Authorization': `${token}`})
      .end((err, res) => {
        if (err) return err;
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.products.should.be.an('array');
        res.body.products.should.have.lengthOf(2);
        done()
      });
    });
});

describe("POST /api/products/create", () => {
  let token;
  before((done) => {
    chai.request(app)
      .post('/api/users/login')
      .send({
        email: "testjwt@user.com",
        password: "TestPass",
      })
      .end((err,res) => {
        if (err) return err;
        token = res.body.token;
        done();
      });
  });
  it("Should require authorization", (done) => {
    chai.request(app)
      .post('/api/products/create')
      .end((err,res) => {
        if (err) return err;
        res.should.have.status(401);
        done();
      });
  });
  it("Should create product that belongs to user that makes request", (done) => {
    chai.request(app)
      .post('/api/products/create')
      .set({'Authorization': `${token}`})
      .send({productname: "Violin", price: "3", isforsale: true})
      .end((err, res) => {
        if (err) return err;
        res.should.have.status(200);
        res.body.should.be.a('object');
        assert.equal(res.body.created, "success");
        assert.equal(res.body.user, "TestUserSeller");
        assert.notEqual(res.body.product._id, undefined);
        assert.equal(res.body.product.name, "Violin");
        assert.equal(res.body.product.price, "3");
        assert.equal(res.body.product.isForSale, true);
        done()
      });
  });
});

describe("PUT /api/products/update/:id", () => {
  let tokenOwner;
  let tokenNotOwner;

  before((done) => {
    chai.request(app)
      .post('/api/users/login')
      .send({
        email: "testjwt@user.com",
        password: "TestPass",
      })
      .end((err,res) => {
        if (err) return err;
        tokenOwner = res.body.token;
        done();
      });
  });

  before((done) => {
    chai.request(app)
      .post('/api/users/login')
      .send({
        email: "testuser@buyer.com",
        password: "BuyerPass",
      })
      .end((err,res) => {
        if (err) return err;
        tokenNotOwner = res.body.token;
        done();
      });
  });

  it("Should require authorization", (done) => {
    chai.request(app)
      .put(`/api/products/update/${aProduct._id}`)
      .end((err,res) => {
        if (err) return err;
        res.should.have.status(401);
        done();
      });
  });

  it("Product should belong to user", (done) => {
    chai.request(app)
      .put(`/api/products/update/${aProduct._id}`)
      .set({'Authorization': `${tokenNotOwner}`})
      .send({
        productname: "ViolinModificado", 
        price: "5", 
        isforsale: "false",
      })
      .end((err,res) => {
        if (err) return err;
        res.should.have.status(404);
        done();
      });
  });

  it("Should update product that belongs to user that makes request", (done) => {
    chai.request(app)
      .put(`/api/products/update/${aProduct._id}`)
      .set({'Authorization': `${tokenOwner}`})
      .send({
        productname: "ViolinModificado", 
        price: "5", 
        isforsale: "false",
      })
      .end((err, res) => {
        if (err) return err;
        res.should.have.status(200);
        res.body.should.be.a('object');
        assert.equal(res.body.updated._id, aProduct._id);
        assert.equal(res.body.updated.name, "ViolinModificado");
        assert.equal(res.body.updated.price, "5");
        assert.equal(res.body.updated.isForSale, false);
        done()
      });
  });

  it("Should require product name for update", (done) => {
    chai.request(app)
      .put(`/api/products/update/${aProduct._id}`)
      .set({'Authorization': `${tokenOwner}`})
      .send({
        productname: null, 
        price: "5", 
        isforsale: "false",
      })
      .end((err, res) => {
        if (err) return err;
        res.should.have.status(400);
        res.body.should.be.a('object');
        assert.equal(res.body.error.product_name_error,"Product name is required");
        done()
      });
  });

  it("Should require product is for sale status for update", (done) => {
    chai.request(app)
      .put(`/api/products/update/${aProduct._id}`)
      .set({'Authorization': `${tokenOwner}`})
      .send({
        productname: "Violin", 
        price: "5", 
        isforsale: null,
      })
      .end((err, res) => {
        if (err) return err;
        res.should.have.status(400);
        res.body.should.be.a('object');
        assert.equal(res.body.error.is_for_sale_error,"Stating wether product is for sale is required");
        done()
      });
  });

  it("Should require product price for update", (done) => {
    chai.request(app)
      .put(`/api/products/update/${aProduct._id}`)
      .set({'Authorization': `${tokenOwner}`})
      .send({
        productname: "Violin", 
        price: null, 
        isforsale: "true",
      })
      .end((err, res) => {
        if (err) return err;
        res.should.have.status(400);
        res.body.should.be.a('object');
        assert.equal(res.body.error.price_error,"Price is required");
        done()
      });
  });

  it("Should require product price to be a number", (done) => {
    chai.request(app)
      .put(`/api/products/update/${aProduct._id}`)
      .set({'Authorization': `${tokenOwner}`})
      .send({
        productname: "Violin", 
        price: "Violin", 
        isforsale: "true",
      })
      .end((err, res) => {
        if (err) return err;
        res.should.have.status(400);
        res.body.should.be.a('object');
        assert.equal(res.body.error.price_error,"Price must be a number");
        done()
      });
  });

  it("Should require valid Mongo Id", (done) => {
    chai.request(app)
      .put('/api/products/update/1234')
      .set({'Authorization': `${tokenOwner}`})
      .send({
        productname: "Violin", 
        price: "Violin", 
        isforsale: "true",
      })
      .end((err, res) => {
        if (err) return err;
        res.should.have.status(400);
        res.body.should.be.a('object');
        assert.equal(res.body.error.product_error,"Product Id is required");
        done()
      });
  });
});

