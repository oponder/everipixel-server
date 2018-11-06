class ClaimService {
  constructor(params) {
    this.EVTWrapper = params.EVTWrapper;
    this.domain = params.domain;
  }

  async createDomainIfNotExists() {
    let {err, response} = await this.EVTWrapper.getDomain(this.domain);
    if (err && err.code === 3150002) {
      // Domain doesn't exist yet, so create it.
      return await this.EVTWrapper.createDomain(this.domain);
    }

    return {err, response};
  }

  async create(data) {
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
