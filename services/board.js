class BoardService {
  constructor(params) {
    this.EVTWrapper = params.EVTWrapper;
    this.domain = params.domain;
    this.board = [];
    this.events = ['status'];
  }

  async cacheBoard() {
    console.log('Caching board, please wait.');
    var err = null;
    var response = null;
    var x;

    for (x = 0; x < 2500; x++) {
      let {err, response} = await this.EVTWrapper.getToken(this.domain, x.toString());
      if (response && response.metas) {
        let colorMetas = response.metas
                        .filter(meta => meta.key.startsWith("color"))
                        .sort((a, b) => {
                          let bN = parseInt(b.key.replace("color", ""));
                          let aN = parseInt(a.key.replace("color", ""));
                          if (isNaN(bN)) {
                            return -1;
                          }
                          return bN - aN;
                        });

        if (colorMetas[0]) {
          let color = colorMetas[0].value;
          this.board.push(color);
        } else {
          this.board.push(null);
        }
      } else {
        this.board.push(null);
      }
    }

    return {err, response};
  }

  async find(data, params) {
    return {
      board: this.board
    }
  }

  // Trigger a update in the cache of a single pixel.
  async get(data, params) {
    let pixelId = parseInt(data);
    let color = undefined;

    if (pixelId > -1 && pixelId < 2500) {
      let {err, response} = await this.EVTWrapper.getToken(this.domain, pixelId.toString());

      if (response && response.metas) {
        let colorMetas = response.metas
                        .filter(meta => meta.key.startsWith("color"))
                        .sort((a, b) => {
                          let bN = parseInt(b.key.replace("color", ""));
                          let aN = parseInt(a.key.replace("color", ""));
                          if (isNaN(bN)) {
                            return -1;
                          }
                          return bN - aN;
                        });

        if (colorMetas[0]) {
          color = colorMetas[0].value;
          this.board[pixelId] = color;
          this.emit('status', {id: pixelId, color: color});
        } else {
        }
      }
    }

    return {
      pixelId: data,
      color: color
    }
  }

}

module.exports = BoardService;
