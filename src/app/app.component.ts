import { AfterViewChecked,Component, OnInit } from '@angular/core';
import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as nipplejs from 'nipplejs';
declare let window: any
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewChecked{
  title = 'ImmortalCombatantsAngular';
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  manager: THREE.LoadingManager;
  camera: THREE.PerspectiveCamera;
  listener: THREE.AudioListener;
  audioLoader: THREE.AudioLoader;
  raycaster: THREE.Raycaster;
  SOUND_VOLUME: number;
  GRAPHICS : string;
  characters = [];
  mixers = {player1:[],player2:[]};
  CharacterSpecs = {
    Hulk : {
       Attack: {time:400,distance:17},
       Attack1: {time:1300,distance:20},
       Gender:'Man'
    },
    VanGuard : {
        Attack : {time:1050,distance:20},
        Attack1 : {time:1050,distance:17},
        Gender:'Man'
    },
    Arissa : {
        Attack : {time:1050,distance:17},
        Attack1 : {time:1900,distance:20},
        Gender:'Woman'
    },
    Pirate : {
      Attack : {time:800,distance:17},
      Attack1 : {time:1050,distance:20},
      Gender:'Woman',
      Scale: '0.3'
    },
    Lola : {
      Attack : {time:1050,distance:20},
      Attack1 : {time:800,distance:17},
      Gender:'Woman',
      Scale: '0.091'
    },
    Mutant : {
        Attack : {time:1050,distance:20},
        Attack1 : {time:1050,distance:17},
        Gender:'Man'
    },
    Ely : {
      Attack : {time:1050,distance:20},
      Attack1 : {time:1050,distance:17},
      Gender:'Man',
      Scale: '0.1'
  }, 
  }
  gameover: any;
  paused: boolean = false;
  Impacting: boolean = false;
  initialLoad: boolean = false;
  player1: string = 'VanGuard';
  player2: string = 'Lola';
  mode: number;
  previousRAF: any = null;
  settingsActive: boolean;
  menuActive: boolean = true;
  topBarActive:boolean = false;
  loaderActive: boolean = false;
  topBarOptionsActive: boolean = false;
  promptActive: boolean = false;
  promptMessage: string = "";
  controlsActive: boolean = false;
  pauseButton:SafeHtml = this.sanitized.bypassSecurityTrustHtml( CONSTANTS.pause);
  menuButton:SafeHtml = this.sanitized.bypassSecurityTrustHtml( CONSTANTS.menu);
  player1Health: string = "100%";
  player2Health: string = "100%";
  loadPercentage: string;
  loadProgress: SafeHtml = this.sanitized.bypassSecurityTrustHtml('Hang in there, it usually takes more time on the first load!');
  constructor(private sanitized: DomSanitizer){}
  
  ngOnInit(): void {
    this.camera = new THREE.PerspectiveCamera(60, 1920 / 1080, 1, 1000);
    this.scene = new THREE.Scene();
    this.renderer =  new THREE.WebGLRenderer();
    this.manager = new THREE.LoadingManager();
    this.camera.position.set(75, 20, 0);
    this.listener = new THREE.AudioListener();
    this.raycaster = new THREE.Raycaster();
    this.camera.add( this.listener );
    this.audioLoader = new THREE.AudioLoader();
    this.SOUND_VOLUME = Number(localStorage.getItem('SOUND')) || 50;
    this.GRAPHICS = localStorage.getItem('GRAPHICS') || 'HIGH';
    if( sessionStorage.getItem('player1') && sessionStorage.getItem('players').toLocaleString().split(',').length> 0)
       { 
        this.player1 = sessionStorage.getItem('player1');
        this.player2 =  sessionStorage.getItem('players').split(',')[this.getRandom(sessionStorage.getItem('players').split(',').length)].toLocaleString();
        this.startGame(this.player1,this.player2,Number(sessionStorage.getItem('mode')));
    }    
  }

  ngAfterViewChecked(){
    if(document.getElementById('JoyStick') && !document.getElementById('JoyStick').children.length)
      {
        let current;
        let joyStick = nipplejs.create({
        zone : document.getElementById('JoyStick'),
        mode : 'static',
        position: {top: '5%', left: '15%'},
        color:'#FAFAFA',
        dynamicPage : true,
      })
      joyStick.on('dir:up',()=>{
        if(current)
        clearInterval(current);
        current = setInterval(()=>{this.controller('W')},1000);
      })
      joyStick.on('dir:left',()=>{
        if(current)
        clearInterval(current);
        current = setInterval(()=>{this.controller('A')},50);
      })
      joyStick.on('dir:right',()=>{
        if(current)
        clearInterval(current);
        current = setInterval(()=>{this.controller('D')},50);
      })
      joyStick.on('end',()=>{
        clearInterval(current);
      })
  }
  }

  startGame(player1,player2,mode){
    if(player1 && player2){
        this.menuActive = false;
        this.topBarActive = true;
        this.showPrompt(true, 'Loading...')
        this.InitializeFight(player1, player2, mode);
}}

  soundEffect(file, loop, volume, path?) {
    if(!volume) return;
    const sound = new THREE.Audio( this.listener );
    const completePath = path || 'assets/Sounds/';
    this.audioLoader.load( completePath + file , function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( loop );
        sound.setVolume( volume/100 );
        sound.play();
    });
  }

  controller(key) {
    if(this.characters.length > 1 && !this.gameover && !this.paused && this.initialLoad){
        let character1 = this.getCharacterbyName("player1");
        let character2 = this.getCharacterbyName("player2");
        let areClose = this.checkDistance(13);
        let character1Leaving = this.checkIfLeavingScene("player1",20);
        let character2Leaving = this.checkIfLeavingScene("player2",20);
    switch(key.toUpperCase())
    {
        case 'W': {
            if(!this.mixers['player1moving'])
            this.animation(character1, 'assets/', `Action/${this.player1}/Jump.fbx`, { loopOnce : true})
            break; 
            }
        case 'A': {
            if(!character1Leaving)
            character1.position.z += 2; 
            break; 
            }
        case 'D': {
            if(!areClose)
            character1.position.z -= 2;
            break;
            } 
        case 'F':{
            if(!this.mixers['player1moving'])
            this.Attack('player1','player2',character1,character2,'Attack', 'Impact', 90);
            break;
            } 
        case 'P':{
            if(!this.mixers['player2moving'])
            this.Attack('player2','player1',character2,character1,'Attack', 'Impact', 90)
            break;
            } 
        case 'E':{
            if(!this.mixers['player1moving'])
            this.Attack('player1','player2',character1,character2, 'Attack1', 'Impact1', 160);
            break;
            }   
        case 'CONTROL':{
            if(!this.mixers['player2moving'])
            this.Attack('player2','player1',character2,character1, 'Attack1', 'Impact1', 160);
            break;
        } 
        case 'ARROWUP':{
            if(!this.mixers['player2moving'])
            this.animation(character2, 'assets/', `Action/${this.player2}/Jump.fbx`, { loopOnce : true});
            break;
        }
        case 'ARROWLEFT':{
            if(!areClose)
            character2.position.z +=2;
            break;
        }
        case 'ARROWRIGHT':{
            if(!character2Leaving)
            character2.position.z -=2;
            break;
        }
        case 'I':{
            console.log(this.characters);
            console.log(this.mixers);
        }
    }
    }     
  }
  getCharacterbyName(code){
    let character;
    if(this.characters.length > 0)
    character = this.characters.find(character => { return (character.code === code)});
    return character;
  }   

  checkDistance = (distance) => {
    let character1 =  this.getCharacterbyName("player1");
    let character2 =  this.getCharacterbyName("player2");
    return (character1.position.z - character2.position.z < distance
        && character1.position.z - character2.position.z > -1 * distance)
  }

  checkIfLeavingScene = (player, offset) =>{
    let character = this.getCharacterbyName(player);
    return (!(character.position.z < offset && character.position.z > (-1* offset)))
  }

  animation = (fbx, path, animFile, options?) => {
    const anim = new FBXLoader(this.manager);
    anim.setPath(path);
    anim.load(animFile, (anim) => {
      const m = new THREE.AnimationMixer(fbx);
      const idle = m.clipAction(anim.animations[0]);
      if(options && options.loopOnce === true)
        {
            this.mixers[fbx.code][1] = m;
            this.mixers[`${fbx.code}moving`] = true;
            setTimeout(() => {
              if(!this.gameover && !options.aggressor)
                this.mixers[`${fbx.code}moving`] = false;
            }, 500);
            idle.setLoop( THREE.LoopOnce );
            setTimeout(()=>{
                if(!this.gameover && options.aggressor)
                  this.mixers[`${fbx.code}moving`] = false;
 
                else
                  this.mixers[fbx.code].splice(0,1)
  
                }, anim.animations[0].duration * 1000);
        }
        else{
          this.mixers[fbx.code][0] = m;
        }
      if(options && options.clampWhenFinished === true)
      idle.clampWhenFinished = true;
      idle.play();
    });
    }

  Attack(Aggressor,Aggressee,AggressorObject,AggresseeObject,Attack,Impact,loss){
      let character1,character2;
      // this.Impacting = true;
      const Sounds = [[`Effort${this.CharacterSpecs[AggressorObject.name].Gender}.wav`, "Missed0.mp3", "Missed1.wav"][this.getRandom(3)], `Punch${this.getRandom(7)}.mp3`]
      this.animation(AggressorObject, 'assets/', `Action/${AggressorObject.name}/${Attack}.fbx`, { loopOnce : true, aggressor: true});
      setTimeout(()=>{
          if(this.checkDistance(this.CharacterSpecs[AggressorObject.name][Attack].distance)){
            this.animation(AggresseeObject, 'assets/',`Action/${AggresseeObject.name}/${Impact}.fbx`, { loopOnce : true});
            this.soundEffect(Sounds[1], false, this.SOUND_VOLUME);
          AggresseeObject.health -= loss;
          if(Aggressor === "player1") {character1 = AggressorObject; character2 = AggresseeObject;}
          else{character2 = AggressorObject; character1 = AggresseeObject;}
          if(!this.checkIfLeavingScene(Aggressee,16)){
              AggresseeObject.position.z += Aggressor === "player2" ?  4 : -4; 
              // AggressorObject.position.z += Aggressor === "player2" ?  2 : -2; 
              }   
          this.player1Health = (character1.health/15 > 0) ? `${character1.health/15}%` : "0%";
          this.player2Health = (character2.health/15 > 0) ? `${character2.health/15}%` : "0%";
          if(AggresseeObject.health<= 0) 
            this.checkIfDead(AggressorObject,AggresseeObject);
          }
          else
          this.soundEffect(Sounds[0],  false, this.SOUND_VOLUME); 
          // this.Impacting = false;
      },this.CharacterSpecs[AggressorObject.name][Attack].time);
    }

  getRandom(max){
      return Math.floor(Math.random() * Math.floor(max))
    }

  loadManager(){
    this.manager.onStart = () => {
        if(!this.initialLoad){
          this.loaderActive = true;
        }
    }
    this.manager.onLoad =  () => {
      this.showPrompt(false, "");
        this.loaderActive = false;
        if(!this.initialLoad){
            this.characters.forEach(el => {el.visible = true;}
                );
                var i = 3;
                this.showPrompt(true, String(i));
                this.soundEffect('Fight.wav', false, this.SOUND_VOLUME)
                var countDown = setInterval(() => {
                    i--;
                    if(i!=0)
                    this.showPrompt(true, String(i))
                    else{
                    clearInterval(countDown);
                    this.showPrompt(true, 'FIGHT')
                    this.NPC();
                    if(this.mode === 1)
                    this.NPC1();
                    else
                      this.controlsActive = true;
                    setTimeout(()=> {
                        this.showPrompt(false,'');
                        this.topBarOptionsActive = true;
                        this.initialLoad = true;
                    },2000)
                    }
                }, 1000);
         }
        };
        this.manager.onProgress =  ( url, itemsLoaded, itemsTotal ) => {
            if(!this.initialLoad){
            this.loadPercentage = String(itemsLoaded / itemsTotal * 100) + "%";
            this.loadProgress = this.sanitized.bypassSecurityTrustHtml("loading - "+ itemsLoaded +" / "+ itemsTotal +" - " + url); }
        };
        this.manager.onError = ( url ) => {
            console.log( 'Error loading ' + url );
        };  
    }

  showPrompt(display:boolean,message:string){
      this.promptActive = display;
      this.promptMessage = message;
  }

  checkIfDead(AggressorObject, AggresseeObject){
      var message;
      var wins = true ;
      this.gameover = true;
          this.animation(AggresseeObject, 'assets/', `Action/${AggresseeObject.name}/Dies.fbx`,{ loopOnce : true, clampWhenFinished : true })
          this.animation(AggressorObject, 'assets/', `Action/${AggressorObject.name}/Wins.fbx`,{ loopOnce : true, clampWhenFinished : true })
          if(this.mode === 0 )
          {
          if(AggresseeObject.code === "player1")
              {
                  this.soundEffect('Dies.wav', false, this.SOUND_VOLUME); 
                  sessionStorage.clear();
                  wins = false;
              }      
          else
          {this.soundEffect('Wins.wav', false, this.SOUND_VOLUME);wins = true}
          }
          this.soundEffect('Wins.wav', false, this.SOUND_VOLUME, `./assets/Action/${AggressorObject.name}/`);
          message = `${AggressorObject.name} Wins!`
          this.showPrompt(true, message);
          setInterval(() => {
              if(!sessionStorage.getItem('players') && wins)
              {
                  var PlayerArray = Object.keys(this.CharacterSpecs);
                  if(PlayerArray.includes(AggresseeObject.name))
                  PlayerArray.splice(PlayerArray.indexOf(AggresseeObject.name), 1);
                  sessionStorage.setItem('players', PlayerArray.toLocaleString());
              }
              else if(wins){
                  if(sessionStorage.getItem('players').toLocaleString().split(',').length > 0)
                  {
                      var PlayerArray = sessionStorage.getItem('players').toLocaleString().split(',')
                      if(PlayerArray.includes(AggresseeObject.name))
                      PlayerArray.splice(PlayerArray.indexOf(AggresseeObject.name),1)
                      sessionStorage.setItem('players',  PlayerArray.toLocaleString());
                   }}
              if(this.mode === 1 && !sessionStorage.getItem('players'))
              {
                var PlayerArray = Object.keys(this.CharacterSpecs);
                if(PlayerArray.includes(AggresseeObject.name))
                PlayerArray.splice(PlayerArray.indexOf(AggresseeObject.name), 1);
                sessionStorage.setItem('players', PlayerArray.toLocaleString());
              }
                  sessionStorage.setItem('mode', String(this.mode))
                  sessionStorage.setItem('player1',AggressorObject.name)
                  if(!sessionStorage.getItem('players'))
                      sessionStorage.clear();
              window.location.reload();
          }, 5000);
      }

  NPC(){
    //always Player2
        const actions = ['CONTROL', 'P'];
        const movement = ['ARROWUP', 'ARROWRIGHT'];
        const forward = ['ARROWLEFT'];
        const timeElapsed = [5000,2000,4000]
            var follow = setInterval(() => {
                if(!this.checkDistance(15))
                if(this.paused)
                clearInterval(follow);
                this.controller(forward[0]);
            }, 700);
            var attack = setInterval(() => {
                if(this.paused)
                clearInterval(attack);
                this.controller(actions[this.getRandom(2)]);
            }, timeElapsed[this.getRandom(3)]);
            var move = setInterval(() => {
                if(this.paused)
                clearInterval(move);
                this.controller(movement[this.getRandom(2)]);
            }, 7000)
  }

  NPC1(){
    //always Player1(in Watch mode)
        const actions = ['E', 'F'];
        const movement = ['W', 'A'];
        const forward = ['D'];
        const timeElapsed = [2000,3000,6000]
            var follow = setInterval(() => {
                if(!this.checkDistance(15))
                if(this.paused)
                clearInterval(follow);
                this.controller(forward[0]);
            },700);
            var attack = setInterval(() => {
                if(this.paused)
                clearInterval(attack);
                this.controller(actions[this.getRandom(2)]);
            }, timeElapsed[this.getRandom(3)]);
            var move = setInterval(() => {
                if(this.paused)
                clearInterval(move);
                this.controller(movement[this.getRandom(2)]);
            }, 6000)
    }

  LoadAnimatedModelAndPlay(player, offset, playerCode, rotate?){
      const loader = new FBXLoader(this.manager);
      loader.setPath('assets/');
      loader.load(`Character/${player}.fbx`, (fbx) => {
          fbx.health = 1500;
          fbx.visible = false;
          fbx.name = player;
          fbx.code = playerCode;
        this.characters.push(fbx);
        var scale = Number(this.CharacterSpecs[player].Scale) || 0.1
        scale = scale*0.9;
        fbx.scale.setScalar(scale);
        if(this.GRAPHICS == "ULTRA"){
        fbx.traverse(el => {
          if(el.isMesh)
              el.castShadow = true;
              el.receiveShadow = true;
        });}
        if(rotate)
          fbx.rotation.y = rotate
          this.animation(fbx, 'assets/', `Action/${player}/Idle.fbx`);
        fbx.position.copy(offset);
        this.scene.add(fbx);
      },
      (xhr)=>{
      }, (err)=>{});
    }

  LoadBackground(){
      const loadBg = new THREE.CubeTextureLoader(this.manager);
      const texture = loadBg.load([
          'assets/Background/posx.jpg',
          'assets/Background/negx.jpg',
          'assets/Background/posy.jpg',
          'assets/Background/negy.jpg',
          'assets/Background/posz.jpg',
          'assets/Background/negz.jpg',
      ]);
      this.scene.background = texture;
      const plane = new THREE.Mesh(
      new THREE.PlaneGeometry( 76.5 ,121.5, 100, 100),
      new THREE.MeshStandardMaterial({
              color: 0x202020,
              map: (new THREE.TextureLoader).load("assets/Background/plane.jpg"),
          }));
      if(this.GRAPHICS=="ULTRA"){
          plane.castShadow = false;
          plane.receiveShadow = true;
      }
      plane.rotation.x = -Math.PI / 2;
      plane.position.x = 60
      this.scene.add(plane);
    }

  RAF(){
      requestAnimationFrame((t) => {
        if (this.previousRAF === null) {
          this.previousRAF = t;
        }if(!this.paused )
        this.RAF();
        this.Step(t - this.previousRAF);
        this.previousRAF = t;
      });
      this.renderer.render(this.scene, this.camera);
    }

  Step(timeElapsed){
      const timeElapsedS = timeElapsed * 0.001;
      var index = [];
      if (this.mixers["player1"]) 
            this.mixers["player1"].forEach((m,i) => {
                if(m._actions[0].enabled)
                  m.update(timeElapsedS)
                else
                    index[0] = i;
              });
            
        if (this.mixers["player2"]) 
          this.mixers["player2"].forEach((m,i) => {
            if(m._actions[0].enabled)
              m.update(timeElapsedS)
            else
              index[1] = i;
            });
    }

  InitializeFight(player1, player2, mode){
      this.loadManager();
      let hemiLight, light;
      this.player1 = player1;
      this.player2 = player2;
      this.mode = mode;
      this.renderer.setClearColor("#E5E5E5");
      hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 2);
      this.scene.add(hemiLight);
      const exposure = {HIGH:.4,ULTRA:.8,MEDIUM:0} 
      light = new THREE.SpotLight(0xffa95c,exposure[this.GRAPHICS]);
      if(this.GRAPHICS === "ULTRA"){
          light.position.set(
              75, 20, 0
          )
          light.castShadow = true;
          light.shadow.bias  = -0.0001;
          light.shadow.mapSize.width = 1024*4;
          light.shadow.mapSize.height = 1024*4;
          }
      else if(this.GRAPHICS === "HIGH"){
          light.position.set(100, 100, 0)
          light.shadow.mapSize.width = 1024*4;
          light.shadow.mapSize.height = 1024*4;
          }
      this.scene.add( light );
      this.renderer.toneMapping =  THREE.ReinhardToneMapping;
      this.renderer.toneMappingExposure = 2.3;
      this.renderer.shadowMap.enabled = true;
      const controls = new OrbitControls(this.camera, this.renderer.domElement);
      controls.target.set(0, 0, 0);
      controls.update();
      this.renderer.setSize( window.innerWidth, window.innerHeight);
      document.body.appendChild( this.renderer.domElement);
      document.addEventListener('keydown', (event) => {this.controller(event.key)});
          this.LoadBackground();
          this.LoadAnimatedModelAndPlay(
                  player2, new THREE.Vector3(52, 4, -14), 'player2');
          this.LoadAnimatedModelAndPlay(
                  player1, new THREE.Vector3(52, 4, 14), 'player1', 3);
          this.RAF();
      }      

  changeSettings(option){
      this.soundEffect('Button.wav', false, this.SOUND_VOLUME);
        switch(option){
          case "GRAPHICS" : {
            var options = ['ULTRA', 'HIGH', 'MEDIUM'];
            const current = this.GRAPHICS;
            this.GRAPHICS = options[options.indexOf(current) + 1] || options[0];
            break;
          }
          case "SOUNDUP" : {
            if(this.SOUND_VOLUME < 100)
             this.SOUND_VOLUME += 5;
             break;
          }
          case "SOUNDDOWN" : {
            if(this.SOUND_VOLUME > 0)
             this.SOUND_VOLUME -= 5;
             break;
          }
          case "SAVE": {
            localStorage.setItem("GRAPHICS",this.GRAPHICS);
            localStorage.setItem("SOUND",String(this.SOUND_VOLUME));
            this.settingsActive = false;
            break;
          }
      }
  }

  topBarOptions(option){
    switch(option){
      case "HOME":{
        sessionStorage.clear();
        window.location.reload();
        break;
      }
      case "PAUSE":{
        this.paused = !this.paused;
        if(this.paused){
            this.showPrompt(true,'PAUSED');
            this.pauseButton = this.sanitized.bypassSecurityTrustHtml( CONSTANTS.play );
        }
        else{
            this.NPC();
            if(this.mode === 0)
                 {}
            if(this.mode === 1)
            this.NPC1();
            this.showPrompt(false, '');
            this.pauseButton = this.sanitized.bypassSecurityTrustHtml( CONSTANTS.pause );
            this.RAF();
        }
        this.mixers['player1'].forEach(m=>{
          m._actions[0].paused = this.paused;
        })  
        this.mixers['player2'].forEach(m=>{
          m._actions[0].paused = this.paused;
      })  
        break;
      }
  }
  }


  changeMenuOptions(option, value?){
    this.soundEffect('Button.wav', false, this.SOUND_VOLUME);
    switch(option){
      case "FIGHT": {
        this.startGame(this.player1,this.player2,0);
        if( window.plugins &&  window.plugins.insomnia)
        window.plugins.insomnia.keepAwake();
        break;
      }
      case "WATCH": {
        this.startGame(this.player1,this.player2,1);
        if( window.plugins &&  window.plugins.insomnia)
        window.plugins.insomnia.keepAwake();
        break;
      }
      case "SETTINGS": {
        this.settingsActive = true;
        this.GRAPHICS = localStorage.getItem("GRAPHICS") || "HIGH";
        this.SOUND_VOLUME = Number(localStorage.getItem("SOUND")) || 30;
        break;
      }
      case "PLAYER1": {
        this.player1 = value;
        break;
      }
      case "PLAYER2": {
        this.player2 = value;
        break;
      }
    }
  }

    // document.getElementById('player1_select').addEventListener('change',()=>{
    //     soundEffect('Button.wav', false, SOUND_VOLUME);
    // });
    // document.getElementById('player2_select').addEventListener('change',()=>{
    //     soundEffect('Button.wav', false, SOUND_VOLUME);
    // });
}

export enum CONSTANTS{
  pause = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause" viewBox="0 0 16 16">
      <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
    </svg>`,
  play = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16">
      <path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
    </svg>`,
  menu = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-house" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/>
      <path fill-rule="evenodd" d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"/>
    </svg>`,
}


