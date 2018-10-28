class ClaimService {
  constructor(params) {
    this.EVTWrapper = params.EVTWrapper
  }

  async createDomainIfNotExists() {
    let {err, response} = await this.EVTWrapper.getDomain("pixeltoken");
    if (err && err.code === 3150002) {
      // Domain doesn't exist yet, so create it.
      return await this.EVTWrapper.createDomain("pixeltoken");
    }

    return {err, response};
  }

  async create(data, params) {
    console.log(data);
    let {err, response} = await this.EVTWrapper.issueNonFungible("pixeltoken", data.id, data.owner)
    if (err != null) {
      throw err;
    }

    return {
      message: response
    }
  }

}

module.exports = ClaimService;
