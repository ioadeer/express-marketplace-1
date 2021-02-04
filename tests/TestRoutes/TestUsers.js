/* eslint-disable */
const chai = require('chai');
const assert =  require('chai').assert;
const chaiHttp = require('chai-http');
const app = require('../../server');

const User = require('../../models/User');
// Configure chai
chai.use(chaiHttp);
chai.should();


describe('Users register', () => {

  let testUser = new User({
    name: 'TestUser',
    email: 'test@user.com',
    password: 'TestPass',
  });

  before( () => {
    testUser.save()
      .then(user => { return user })
      .catch(err => console.log('err :'+err+' couldn\'t create test user'));
  });

  it('User register should return err or user ', (done) =>{
    let userJson = {
          name: 'DummyName',
          email: 'dummy@name.com',
          password: 'DummyPassword',
          password2: 'DummyPassword',
        }
    chai.request(app)
        .post('/api/users/register')
        .send(userJson)
        .end((err,res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          assert.equal(res.body.name, userJson.name);
          assert.equal(res.body.email, userJson.email);
          assert.notEqual(res.body.password, userJson.password);
          done();
        });
  });

  it('User', () =>{
    it('User login should return err or user ', (done) =>{
      chai.request(app)
          .post('api/users/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .end((err,res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            assert.equal(res.json.success, 'true');
            done();
          });
    });
  });
});
