function Bullet(x, y, rotation, scene) {
  let b = scene.physics.add.image(x, y, 'ship');
  scene.my_entities.add(b);
  b.rotation = rotation;
  return b;
}

function Player(x, y, scene) {
  let p = scene.physics.add.image(50, 50, 'ship');
  scene.my_entities.add(p);

  p.name = scene.socket.id;
  p.setDrag(100);
  p.setAngularDrag(100);
  p.setMaxVelocity(200);

  p.update = function() {
    if(scene.cursors.left.isDown) {
      p.setAngularVelocity(-150);
    }
    else if(scene.cursors.right.isDown) {
      p.setAngularVelocity(150);
    }
    else {
      p.setAngularVelocity(0);
    }

    if(scene.cursors.up.isDown) {
      scene.physics.velocityFromRotation(p.rotation + 1.5, 100, p.body.acceleration);
    } else {
      p.setAcceleration(0);
    }

    if(Phaser.Input.Keyboard.JustDown(scene.spacebar)) {
      Bullet(p.x, p.y, p.rotation, scene);
    }
  }

  return p;
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
    this.other_entities = this.physics.add.group();
    this.my_entities = this.physics.add.group();
    this.cursors = this.input.keyboard.createCursorKeys();

    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    let self = this;
    this.socket.on('connect', () => {
      Player(50, 50, this);
    });

    this.socket.on('server_entities', function(server_entities) {
      self.other_entities.getChildren().forEach((e) => {
        e.destroy();
      });

      Object.keys(server_entities).forEach(function(id) {
        if(id != self.socket.id) {
          server_entities[id].forEach((entity) => {
            let e = self.physics.add.image(entity.x, entity.y, entity.textureKey);
            e.rotation = entity.rotation;
            self.other_entities.add(e);
          });
        }
      });
    });

    this.send_loop = setInterval(() => {
      this.socket.emit('my_entities', this.my_entities.getChildren());
    }, 33); 
  }

  update() {
    scene.physics.velocityFromRotation(b.rotation, 100);
    this.my_entities.getChildren().forEach((e) => {
      if(e.update) e.update();
    });
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
      debug: false
    }
  },
  scene: MyScene
};

var game = new Phaser.Game(config);