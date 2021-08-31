import { getGameHeight } from '../helpers';

interface Props {
  scene: Phaser.Scene;
  x: number;
  y: number;
  key: string;
  frame?: number;
}

export class Player extends Phaser.GameObjects.Sprite {

  private jumpKey: Phaser.Input.Keyboard.Key;
  private pointer: Phaser.Input.Pointer;
  private isFlapping = false;
  private _isDead = false;

  public speed = 200;

  get isDead(): boolean {
    return this._isDead;
  }

  set isDead(value: boolean) {
    this._isDead = value;
    if (this.isDead) {
      this.anims.play('dead');
    }
  }

  constructor({ scene, x, y, key }: Props) {
    super(scene, x, y, key);

    this.anims.create({
      key: 'flap',
      frames: this.anims.generateFrameNumbers(key || '', {frames: [1,0]}),
      frameRate: 2,
    });
    this.anims.create({
      key: 'dead',
      frames: this.anims.generateFrameNumbers(key || '', {frames: [2]}),
    });

    // sprite
    this.setOrigin(0, 0);

    // physics
    this.scene.physics.world.enable(this);
    (this.body as Phaser.Physics.Arcade.Body).setGravityY(getGameHeight(this.scene) * 1.5);
    (this.body as Phaser.Physics.Arcade.Body).setSize(90,120);

    // input
    this.jumpKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.pointer = this.scene.input.activePointer;

    this.scene.add.existing(this);
  }

  update(): void {
    if ((this.jumpKey.isDown || this.pointer.isDown) && !this.isFlapping) {
      this.isFlapping = true;
      this.anims.play('flap');
      (this.body as Phaser.Physics.Arcade.Body).setVelocityY(-getGameHeight(this.scene) * 0.6);
    } else if (this.jumpKey.isUp && !this.pointer.isDown && this.isFlapping) {
      this.isFlapping = false;
    }

    if (this.y > getGameHeight(this.scene) || this.y < 0){
      this.isDead = true;
    }
  }
}
