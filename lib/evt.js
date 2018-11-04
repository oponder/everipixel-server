const EVT = require('evtjs');

// a is a helper function for promises that returns the result in a golang
// type of way. this allows for some golang style explicit error handling
// instead of using catch blocks.
//
// Example:
//
// var {err, response} = await a(somePromise());
// if err != null {
//   ... handle the error ...
// }
function a(promise) {
   return promise.then(data => {
      return {err: null, response: data};
   })
   .catch((err) => {
      return {err: err, response: null}
    });
}

// issueNonFungible attempts to issue a NFT.
async function issueNonFungible(apiCaller, ownerPublicKey, domain, name) {
  return await apiCaller.pushTransaction(
    new EVT.EvtAction("issuetoken", {
        "domain": domain,
        "names": [name],
        "owner": [ownerPublicKey]
    })
  );
}

// createDomain attempts to create a domain with the given name.
async function createDomain(apiCaller, name, publicKey) {
  return await apiCaller.pushTransaction(
    { maxCharge: 10000, payer: publicKey },
    new EVT.EvtAction("newdomain", {
        "name": name,
        "creator": publicKey,
        "issue": {
            "name": "issue",
            "threshold": 1,
            "authorizers": [{
                "ref": "[A] " + publicKey,
                "weight": 1
            }]
        },
        "transfer": {
            "name": "transfer",
            "threshold": 1,
            "authorizers": [{
                "ref": "[G] .OWNER",
                "weight": 1
            }]
        },
        "manage": {
            "name": "manage",
            "threshold": 1,
            "authorizers": [{
                "ref": "[A] " + publicKey,
                "weight": 1
            }]
        }
    })
  );
}

class EVTWrapper {
  constructor(params) {
    let {publicKey, privateKey} = params;
    this.privateKey = privateKey;
    this.publicKey = publicKey;

    let network = {
      host: '127.0.0.1',
      port: 8888,
      protocol: 'http'
    };

    this.apiCaller = EVT({
      endpoint: network,
      keyProvider: privateKey,
      networkTimeout: 10000,
    });
  }


  async getInfo() {
    console.log("Getting info.")
    var {err, response} = await a(this.apiCaller.getInfo());
    if (err != null) {
      console.error(err);
    }
    return {err, response};
  }

  async getToken(domain, name) {
    // console.log("getting token:", name)
    var {err, response} = await a(this.apiCaller.getToken(domain, name));
    if (err != null) {
      // console.error(err);
      if (err.isServerError) {
        err = err.serverError;
      }
    }

    return {err, response};
  }

  async issueNonFungible(domain, name, owner) {
    var {err, response} = await a(issueNonFungible(this.apiCaller, owner, domain, name.toString()));
    if (err != null) {
      console.log(err);
    }
    return {err, response};
  }

  async createDomain(name, owner) {
    console.log("Creating domain:", name)
    var {err, response} = await a(createDomain(this.apiCaller, name, this.publicKey));
    if (err != null) {
      console.log(err);
    }
    return {err, response};
  }

  async getDomain(name) {
    console.log("Getting domain:", name)
    var {err, response} = await a(this.apiCaller.getDomainDetail(name));
    if (err != null) {
      // console.error(err);
      if (err.isServerError) {
        err = err.serverError;
      }
    }
    return {err, response};
  }
}

module.exports = EVTWrapper;
