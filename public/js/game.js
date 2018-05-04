class Player extends Phaser.GameObject.Sprite {
  constructor(scene) {
    super(scene);
    //Phaser.GameObjects.Image.call(this, scene, 0, 0,  )
  }

  update() {

  }
}

class MyScene extends Phaser.Scene {
  constructor(config) {
    super({
      key: "MyScene"
    })
  }
  
  preload() {
    this.load.image('ship', 'assets/spaceShips_001.png');
    this.load.image('otherPlayer', 'assets/enemyBlack5.png');
    this.load.image('star', 'assets/star_gold.png');
  }

  create() {
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.my_entities = this.physics.add.group();

    let self = this;
    this.socket.on('currentPlayers', function(players) {
      Object.keys(players).forEach(function(id) {
        if (players[id].playerId === self.socket.id) {
          self.addPlayer(players[id]);
        } else {
          self.addOtherPlayers(players[id]);
        }
      });
    });

    this.socket.on('newPlayer', function (playerInfo) {
      this.addOtherPlayers(playerInfo);
    });

    this.socket.on('disconnect', function (playerId) {
      this.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });
    });

    this.socket.on('playerMoved', function (playerInfo) {
      this.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (playerInfo.playerId === otherPlayer.playerId) {
          otherPlayer.setRotation(playerInfo.rotation);
          otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        }
      });
    });
    this.cursors = this.input.keyboard.createCursorKeys();

    /*
    this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
    this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });
    
    this.socket.on('scoreUpdate', function (scores) {
      self.blueScoreText.setText('Blue: ' + scores.blue);
      self.redScoreText.setText('Red: ' + scores.red);
    });

    this.socket.on('starLocation', function (starLocation) {
      if (self.star) self.star.destroy();
      self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
      self.physics.add.overlap(self.ship, self.star, function () {
        self.socket.emit('starCollected');
      }, null);
    });
    */
  }

  addPlayer(playerInfo) {
    this.ship = this.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
      this.ship.setTint(0x0000ff);
    } else {
      this.ship.setTint(0xff0000);
    }
    this.ship.setDrag(100);
    this.ship.setAngularDrag(100);
    this.ship.setMaxVelocity(200);
  }

  addOtherPlayers(playerInfo) {
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
      otherPlayer.setTint(0x0000ff);
    } else {
      otherPlayer.setTint(0xff0000);
    }
    otherPlayer.playerId = playerInfo.playerId;
    this.otherPlayers.add(otherPlayer);
  }

  update() {
    if (this.ship) {
      if (this.cursors.left.isDown) {
        this.ship.setAngularVelocity(-150);
      } else if (this.cursors.right.isDown) {
        this.ship.setAngularVelocity(150);
      } else {
        this.ship.setAngularVelocity(0);
      }
    
      if (this.cursors.up.isDown) {
        this.physics.velocityFromRotation(this.ship.rotation + 1.5, 100, this.ship.body.acceleration);
      } else {
        this.ship.setAcceleration(0);
      }
    
      this.physics.world.wrap(this.ship, 5);

      // emit player movement
      var x = this.ship.x;
      var y = this.ship.y;
      var r = this.ship.rotation;
      if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
        this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
      }
      // save old position data
      this.ship.oldPosition = {
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation
      };
    }
  }
}

var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: [MyScene]
};

var game = new Phaser.Game(config);