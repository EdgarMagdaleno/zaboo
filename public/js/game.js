SOCKET = null;

function spawn_bullet(x, y, rotation, scene) {
	let bullet = scene.physics.add.image(x, y, 'bullet');
	scene.my_entities.add(bullet);

	bullet.setScale(0.15);
	bullet.setVelocityY(1000 * Math.cos(rotation));
	bullet.setVelocityX(1000 * Math.sin(-rotation));
	bullet.rotation = rotation;
	bullet.name = scene.socket.id;
	bullet.update = () => {
		if(bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
			bullet.destroy();
		}
	}

	scene.physics.add.overlap(bullet, scene.other_entities, (bullet, entity) => {
		if(entity.texture.key == "ship") {
			bullet.destroy();
			scene.socket.emit('collision', {id: entity.name, entity: bullet});
		}
	}, null, scene);

	return bullet;
}

function spawn_player(x, y, scene) {
	let player = scene.physics.add.sprite(50, 50, 'ship');
	scene.my_entities.add(player);

	player.customData = {a: 10};
	player.life = 100;
	player.name = scene.socket.id;
	player.setDrag(100);
	player.setAngularDrag(100);
	player.setMaxVelocity(200);

	player.update = function() {
		if(scene.cursors.left.isDown) {
			player.setAngularVelocity(-150);
		}
		else if(scene.cursors.right.isDown) {
			player.setAngularVelocity(150);
		}
		else {
			player.setAngularVelocity(0);
		}

		if(scene.cursors.up.isDown) {
			scene.physics.velocityFromRotation(player.rotation + 1.5, 100, player.body.acceleration);
		} else {
			player.setAcceleration(0);
		}

		if(Phaser.Input.Keyboard.JustDown(scene.spacebar)) {
			spawn_bullet(player.x, player.y, player.rotation, scene);
		}
	}

	scene.socket.on('collision', (collision) => {
		if(collision.textureKey == "bullet") {
		 scene.lifepoints -= 5;
		}
	});

	return player;
}

class MyScene extends Phaser.Scene {
	constructor(config) {
		super({
			key: "MyScene"
		})
	}
	
	preload() {
		this.load.image('ship', 'assets/spaceShips_001.png');
		this.load.image('bullet', 'assets/bullet.png');
		this.load.image('life', 'assets/life.png');
	}

	create() {
		this.socket = SOCKET;
		this.other_entities = this.physics.add.group();
		this.my_entities = this.physics.add.group();
		this.cursors = this.input.keyboard.createCursorKeys();
		this.lifepoints = 100;

		this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

		let self = this;
		self.player = spawn_player(50, 50, this);
		self.healthbar = self.physics.add.image(self.player.x, self.player.y - 20, "life");

		self.healthbar.update = () => {
			self.healthbar.scaleX = self.lifepoints;
			self.healthbar.x = self.player.x + 50;
			self.healthbar.y = self.player.y - 60;
		}

		self.healthbar.scaleX = self.lifepoints;
		self.healthbar.scaleY = 15;
		self.my_entities.add(self.healthbar);

		this.socket.on('server_entities', function(server_entities) {
			self.other_entities.getChildren().forEach((e) => {
				e.destroy();
			});

			Object.keys(server_entities).forEach(function(id) {
				if(id != self.socket.id) {
					server_entities[id].forEach((entity) => {
						let e = self.physics.add.image(entity.x, entity.y, entity.textureKey);
						e.rotation = entity.rotation;
						e.scaleX = entity.scale.x;
						e.scaleY = entity.scale.y;
						e.name = entity.name;
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
		this.my_entities.getChildren().forEach((e) => {
			if(e.update) e.update();
		});
	}
}

class Lobby extends Phaser.Scene {
	constructor() {
		super({
			key: "Lobby"
		})
	}

	preload() {
		this.load.image("space", "assets/space.jpg");
	}

	create() {
		console.log(this);
		SOCKET = io();
		let self = this;
		SOCKET.on('side', (side) => {
			self.side = side;
			console.log(side);
		})

		this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
		this.add.image(400, 300, "space");
		let t = this.add.text(400, 20, "Zaboo");
		t.setOrigin(0.5, 0.5);

		t = this.add.text();
	}

	update() {
		if(Phaser.Input.Keyboard.JustDown(this.spacebar)) {
			if(this.side) this.add.text(200, 300, "READY");
			else this.add.text(600, 300, "READY");
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
			debug: false
		}
	},
	scene: [Lobby, MyScene]
};

var game = new Phaser.Game(config);