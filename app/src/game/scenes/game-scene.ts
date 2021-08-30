import {
  LEFT_CHEVRON, BG, CLICK
} from 'game/assets';
import { AavegotchiGameObject } from 'types';
import { getGameWidth, getGameHeight, getRelative } from '../helpers';
import { Pipe, Player } from 'game/objects';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Game',
};

/**
 * Scene where gameplay takes place
 */
export class GameScene extends Phaser.Scene {
  private player?: Player;
  private selectedGotchi?: AavegotchiGameObject;
  private pipes?: Phaser.GameObjects.Group;

  // Sounds
  private back?: Phaser.Sound.BaseSound;

  constructor() {
    super(sceneConfig);
  }

  init = (data: { selectedGotchi: AavegotchiGameObject }): void => {
    this.selectedGotchi = data.selectedGotchi;
  };

  public create(): void {
    // Add layout
    this.add.image(getGameWidth(this) / 2, getGameHeight(this) / 2, BG).setDisplaySize(getGameWidth(this), getGameHeight(this));
    this.back = this.sound.add(CLICK, { loop: false });
    this.createBackButton();

    // Add a player sprite that can be moved around.
    this.player = new Player({
      scene: this,
      x: getGameWidth(this) / 2,
      y: getGameHeight(this) / 2,
      key: this.selectedGotchi?.spritesheetKey || ''
    })

    this.pipes = this.add.group({
      maxSize: 25,
      classType: Pipe,
      runChildUpdate: true,
    })

    this.addPipeRow();

    // Add another pipe every 2 seconds
    this.time.addEvent({
      delay: 2000,
      callback: this.addPipeRow,
      callbackScope: this,
      loop: true
    });
  }

  private createBackButton = () => {
    this.add
      .image(getRelative(54, this), getRelative(54, this), LEFT_CHEVRON)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .setDisplaySize(getRelative(94, this), getRelative(94, this))
      .on('pointerdown', () => {
        this.back?.play();
        window.history.back();
      });
  };

  private addPipeRow = () : void => {
    const size = getGameHeight(this) / 7;
    const x = getGameWidth(this);
    const velocityX= -getGameWidth(this) / 5;
    const gap = Math.floor(Math.random() * 4) + 1;

    for (let i=0; i < 7; i++){
      if (i !== gap && i !== gap+1){
        const frame = i === gap -1 ? 2 : i === gap + 2 ? 0 : 1;
        this.addPipe(x, size * i, frame, velocityX);
      }
    }
  };

  private addPipe = (x: number, y: number, frame: number, velocityX: number) : void => {
      const pipe : Pipe = this.pipes?.get();
      pipe && pipe.activate(x, y, frame, velocityX);
  };

  public update(): void {
    // Every frame, we update the player
    this.player?.update();
  }
}
