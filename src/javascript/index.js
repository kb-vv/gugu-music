import "./icon.js";
import Swiper from "./swiper.js";

class Player {
  constructor(node) {
    this.root = typeof node === "string" ? document.querySelector(node) : node;
    this.$ = (selector) => this.root.querySelector(selector);
    this.$$ = (selector) => this.root.querySelectorAll(selector);
    this.songList = [];
    this.currentIndex = 0;
    this.audio = new Audio(); //相当于在html里写<audio>标签
    this.start();
    this.bind();
  }
  start() {
    fetch("https://jirengu.github.io/data-mock/huawei-music/music-list.json")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        this.songList = data;
        this.renderSong();
      });
  }
  bind() {
    let self = this;
    this.$(".btn-play-pause").onclick = function () {
      if (this.classList.contains("playing")) {
        self.audio.pause();
        this.classList.remove("playing");
        this.classList.add("pause");
        this.querySelector("use").setAttribute("xlink:href", "#icon-play");
      } else if (this.classList.contains("pause")) {
        self.audio.play();
        this.classList.remove("pause");
        this.classList.add("playing");
        this.querySelector("use").setAttribute("xlink:href", "#icon-pause");
      }
    };
    this.$(".btn-pre").onclick = function () {
      self.playPrevSong();
    };
    this.$(".btn-next").onclick = function () {
      self.playNextSong();
    };
    let swiper = new Swiper(this.root.querySelector(".panels"));
    swiper.on("swipLeft", function () {
      console.log(this);
      this.classList.remove("panel1");
      this.classList.add("panel2");
    });
    swiper.on("swipRight", function () {
      console.log(this);
      this.classList.remove("panel2");
      this.classList.add("panel1");
    });
  }

  renderSong() {
    let songObj = this.songList[this.currentIndex];
    this.$(".header h1").innerText = songObj.title;
    this.$(".header p").innerText = songObj.author + "-" + songObj.albumn;
    this.audio.src = songObj.url;
    this.loadLyrics();
  }
  playPrevSong() {
    this.currentIndex =
      (this.songList.length + this.currentIndex - 1) % this.songList.length;
    this.audio.src = this.songList[this.currentIndex].url;
    this.renderSong();
    this.audio.oncanplaythrough = () => this.audio.play();
  }
  playNextSong() {
    this.currentIndex =
      (this.songList.length + this.currentIndex + 1) % this.songList.length;
    this.audio.src = this.songList[this.currentIndex].url;
    this.renderSong();
    this.audio.oncanplaythrough = () => this.audio.play();
  }
  loadLyrics() {
    fetch(this.songList[this.currentIndex].lyric)
      .then((res) => res.json())
      .then((data) => {
        console.log(data.lrc.lyric);
      });
  }
}
new Player("#player");
