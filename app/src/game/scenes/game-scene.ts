import {
  LEFT_CHEVRON, BG, CLICK, BOOP
} from 'game/assets';
import { AavegotchiGameObject } from 'types';
import { getGameWidth, getGameHeight, getRelative } from '../helpers';
import { Pipe, Player, ScoreZone } from 'game/objects';

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
  private scoreZones? : Phaser.GameObjects.Group;

  // Score
  private score = 0;
  private scoreText? : Phaser.GameObjects.Text;

  // Sounds
  private back?: Phaser.Sound.BaseSound;
  private boop?: Phaser.Sound.BaseSound;

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
    this.boop = this.sound.add(BOOP, { loop: false });
    this.createBackButton();

    // Score
    this.scoreText = this.add.text(
        getGameWidth(this) / 2,
        getGameHeight(this) / 2 - getRelative(190, this),
        this.score.toString(),
        {
          color: '#FFFFFF'
        })
        .setFontSize(getRelative(94, this))
        .setOrigin(0.5)
        .setDepth(1); // set depth to 1 to see score in front of pipes

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

    this,this.scoreZones = this.add.group({ classType: ScoreZone });

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

  private addScoreZone = (x: number, y: number, velocityX: number) : void => {
    const height = 2 * getGameHeight(this) / 7;
    const width = getGameHeight( this) / 7;
    this.scoreZones?.add(
        new ScoreZone({
          scene: this, x, y, width, height, velocityX}
        )
    );
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
      } else if (i === gap) {
        this.addScoreZone(x, size*i, velocityX);
      }
    }
  };

  private addPipe = (x: number, y: number, frame: number, velocityX: number) : void => {
      const pipe : Pipe = this.pipes?.get();
      pipe && pipe.activate(x, y, frame, velocityX);
  };

  private addScore = () => {
    if (this.scoreText){
      this.score += 1;
      this.scoreText.setText(this.score.toString());
    }
  };

  public update(): void {
    if (this.player && !this.player.isDead) {
      this.player.update()

      // Player collides with pipe
      this.physics.overlap(
          this.player,
          this.pipes,
          () => {
            this.player?.setDead(true);
            this.boop?.play();
          },
          undefined,
          this,
      );

      // Player collides with scoreZone
      this.physics.overlap(
          this.player,
          this.scoreZones,
          (_,zone) => {
            (zone as ScoreZone).handleOverlap();
            this.addScore();
          }
      );
    } else {
        // Game over: freeze scene
        Phaser.Actions.Call(
            (this.pipes as Phaser.GameObjects.Group).getChildren(),
            (pipe) => {
              (pipe.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
            },
            this,
        );
        Phaser.Actions.Call(
            (this.scoreZones as Phaser.GameObjects.Group).getChildren(),
            (zone) => {
              (zone.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
            },
            this,
        );
    }

    // Auto-return to main menu when deceased player has left this world...
    if (this.player && this.player.y > this.sys.canvas.height) {
      window.history.back();
    }
  }
}
