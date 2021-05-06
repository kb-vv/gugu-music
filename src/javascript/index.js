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
    this.lyricsArr = [];
    this.lyricIndex = -1;
    this.start();
    this.bind();
  }
  start() {
    //https://jirengu.github.io/data-mock/huawei-music/music-list.json
    fetch("https://kb-vv.github.io/data-music/music-list.json")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        this.songList = data;
        this.loadSong();
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
      console.log("pre");
      self.currentIndex =
        (self.songList.length + self.currentIndex - 1) % self.songList.length;
      self.loadSong();
      if (!self.$(".btn-play-pause").classList.contains("playing")) {
        console.log("111");
        self.$(".btn-play-pause").classList.remove("pause");
        self.$(".btn-play-pause").classList.add("playing");
        self
          .$(".btn-play-pause")
          .querySelector("use")
          .setAttribute("xlink:href", "#icon-pause");
      }
      self.playSong();
    };
    this.$(".btn-next").onclick = function () {
      self.currentIndex = (self.currentIndex + 1) % self.songList.length;
      self.loadSong();
      if (!self.$(".btn-play-pause").classList.contains("playing")) {
        console.log("111");
        self.$(".btn-play-pause").classList.remove("pause");
        self.$(".btn-play-pause").classList.add("playing");
        self
          .$(".btn-play-pause")
          .querySelector("use")
          .setAttribute("xlink:href", "#icon-pause");
      }
      self.playSong();
    };

    this.audio.ontimeupdate = function () {
      //当currentTime更新时会触发timeupdate事件。
      //currentTime以秒为单位返回当前媒体元素的播放时间。设置这个属性会改变媒体元素当前播放位置。
      console.log(parseInt(self.audio.currentTime * 1000));
      self.locateLyric();
      self.setProgerssBar();
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

  loadSong() {
    let songObj = this.songList[this.currentIndex];
    this.$(".header h1").innerText = songObj.title;
    this.$(".header p").innerText = songObj.author + "-" + songObj.albumn;
    this.audio.src = songObj.url;
    this.audio.onloadedmetadata = () => {
      this.$(".time-end").innerText = this.formateTime(this.audio.duration);
      console.log(this.audio.duration); //获取歌曲持续的时间
    };

    this.loadLyric();
  }

  playSong() {
    this.audio.oncanplaythrough = () => this.audio.play();
  }

  //加载歌词
  loadLyric() {
    fetch(this.songList[this.currentIndex].lyric)
      .then((res) => res.json())
      .then((data) => {
        console.log(data.lrc.lyric); //获取对应歌曲json文件的歌词
        this.setLyrics(data.lrc.lyric);
        window.lyrics = data.lrc.lyric;
      });
  }

  //找到当前播放到的该句歌词对应的p元素，
  locateLyric() {
    console.log("locateLyric");
    let currentTime = this.audio.currentTime * 1000;
    let nextLineTime = this.lyricsArr[this.lyricIndex + 1][0];
    if (
      //判断当前媒体元素的播放时间是否大于歌词的时间
      currentTime > nextLineTime &&
      this.lyricIndex < this.lyricsArr.length - 1
    ) {
      this.lyricIndex++;
      let node = this.$(
        //找到对应的p节点，例:"[data-time=314000]""
        '[data-time="' + this.lyricsArr[this.lyricIndex][0] + '"]'
      );
      if (node) this.setLyricToCenter(node);
      this.$$(".panel-effect .lyric p")[0].innerText = this.lyricsArr[
        this.lyricIndex
      ][1];
      this.$$(".panel-effect .lyric p")[1].innerText = this.lyricsArr[
        this.lyricIndex + 1
      ]
        ? this.lyricsArr[this.lyricIndex + 1][1]
        : "";
    }
  }

  //最重点的一个函数，对歌词进行处理
  setLyrics(lyrics) {
    this.lyricIndex = 0;
    let fragment = document.createDocumentFragment();
    let lyricsArr = [];
    this.lyricsArr = lyricsArr;
    lyrics
      .split(/\n/) //将歌词变为一个个数组
      .filter((str) => str.match(/\[.+?\]/)) //将数组每一个元素中带有[]并且里面由任意内容的留下来生成一个新数组
      .forEach((line) => {
        let str = line.replace(/\[.+?\]/g, ""); //遍历上面生成的新数组，并将每个元素里的[]内容替换为""，相当于只剩下歌词
        line.match(/\[.+?\]/g).forEach((t) => {
          //line.match()设置全局模式，找出所有元素的[]的内容，并将他们放在一个数组里，进行遍历
          t = t.replace(/[\[\]]/g, ""); //.forEach遍历上面数组，将[]替换成""相当于去除了中括号，每个元素只剩下"03:54.00"
          let milliseconds = //计算出每句歌词的时间，单位为毫秒，比如414000ms
            parseInt(t.slice(0, 2)) * 60 * 1000 +
            parseInt(t.slice(3, 5)) * 1000 +
            parseInt(t.slice(6));
          lyricsArr.push([milliseconds, str]);
          //将每个歌词的时间与歌词合并成一个数组，并将它们一个个放进一个大的数组,例:[[414000,"愿名字也再不记起"],[314000,"离开我以后我会长留这地"]]
        });
      });

    lyricsArr
      .filter((line) => line[1].trim() !== "") //过滤掉空白的的歌词句
      .sort((v1, v2) => {
        //将每句歌词的时间从小到大排序
        if (v1[0] > v2[0]) {
          return 1;
        } else {
          return -1;
        }
      })
      .forEach((line) => {
        //遍历每个元素，并添加("data-time")属性，值为对应的时间ms，内容为歌词
        let node = document.createElement("p");
        node.setAttribute("data-time", line[0]);
        node.innerText = line[1];
        fragment.appendChild(node);
      });
    this.$(".panel-lyrics .container").innerHTML = "";
    this.$(".panel-lyrics .container").appendChild(fragment); //将所有缓存好的fragment节点。一次性更新渲染
  }

  //对选中的p元素节点进行相应的移动，与删除和添加class为current的属性
  setLyricToCenter(node) {
    //实现选中的p节点为当前歌词所在的节点
    console.log(node);
    //算出当前p节点移动的距离=当前p节点相对于其父节点(.container)的高度-整个放歌词的外框的高度除以2
    let translateY = node.offsetTop - this.$(".panel-lyrics").offsetHeight / 2;
    translateY = translateY > 0 ? translateY : 0;
    //将.container元素向上移动translateY的距离，使得选中的p元素始终在.panel-lyrics容器的中间
    this.$(
      ".panel-lyrics .container"
    ).style.transform = `translateY(-${translateY}px)`;
    //找出所有p元素，并遍历他们，将他们的class为current的属性移出，同时将选中的p元素的class属性设置为current
    this.$$(".panel-lyrics p").forEach((node) =>
      node.classList.remove("current")
    );
    node.classList.add("current");
  }

  //用于谁知播放调的动态长度
  setProgerssBar() {
    console.log("set setProgerssBar");
    //duration，currentTime的单位都是s，为了随时设置播放条的长度，所以将width属性的单位设置为%为单位，所以要先乘以100
    let percent = (this.audio.currentTime * 100) / this.audio.duration + "%";
    // console.log(this.audio.currentTime);
    // console.log(this.audio.duration);
    console.log(percent);
    this.$(".bar .progress").style.width = percent;
    this.$(".time-start").innerText = this.formateTime(this.audio.currentTime);
    console.log(this.$(".bar .progress").style.width);
  }

  //用于生成当前歌曲的时间，例:03:54
  formateTime(secondsTotal) {
    let minutes = parseInt(secondsTotal / 60);
    minutes = minutes >= 10 ? "" + minutes : "0" + minutes;
    let seconds = parseInt(secondsTotal % 60);
    seconds = seconds >= 10 ? "" + seconds : "0" + seconds;
    return minutes + ":" + seconds; //返回值显示当前歌曲的时间
  }
  /*
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

  setLineToCenter(node) {
    let offset = node.offsetTop - this.$(".panels .container").offsetHeight / 2;
    offset = offset > 0 ? offset : 0;
    this.$(".panels .container").style.transform = `translateY(-${offset}px)`;
    this.$$(".panels .container p").forEach((node) =>
      node.classList.remove("current")
    );
    node.classList.add("current");
  }
  */
}
window.p = new Player("#player");
