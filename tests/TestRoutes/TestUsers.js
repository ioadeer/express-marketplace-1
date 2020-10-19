const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

const User = require('../../models/User');
// Configure chai
chai.use(chaiHttp);
chai.should();

describe("Users register", () => {

  let user = new User({
    name: "TestUser",
    email: "test@user.com",
    password: "TestPass",
  });

  before( () => {
    user.save()
      .then(user => console.log("Test user created: "+user))
      .catch(err => console.log("err :"+err+" couldn't create test user"));
  });

  it("User register should return err or user ", (done) =>{
    let userJson = {
          name: "DummyName",
          email: "dummy@name.com",
          password: "DummyPassword",
          password2: "DummyPassword",
        }
    chai.request(app)
        .post('/api/users/register')
        .send(userJson)
        .end((err,res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        });
  });

  it("User", () =>{
    it("User login should return err or user ", (done) =>{
      chai.request(app)
          .post('/login')
          .send({
            email: "test@user.com",
            password: "TestPass",
          })
          .end((err,res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            done();
          });
    });
  });
});
