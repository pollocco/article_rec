function makeNode(elementType, properties){
  let element = document.createElement(elementType);
  for(m=0; m<properties.length; m++){
      for(let prop in properties[m]){
              element[prop] = properties[m][prop]
      }
  }
  return element
}
PAGE_SIZE = 20
var articleList = new Vue({
  el: "#article-list",
  data: {
      articles: [{
          title: "",
          content: "",
          topics: [],
          extraTopics: [],
          author: null,
          url:"",
          articleId: null,
          authorId: null,
          periodicalId: null,
          date:""
      }],
      topics:[],
      userTopics:[],
      activeTopic:{
        name: String,
        topicId: Number,
        relatedTopics:[{
          name: String,
          topicId: Number
        }],
        isUserTopic: Boolean
      },
      activeArticle:{
        title: "",
        content: "",
        topics: [],
        extraTopics: [],
        author: null,
        url:"",
        articleId: null,
        authorId: null,
        periodicalId: null,
        date: ""
      },
      showModal: false,
      showArticleModal:false,
      authorArticles:[{
        authorFullName:"",
        authorId:0,
        numberOfArticles:0
      }],
      periodicalArticles:[{
        periodicalName:"",
        periodicalId:0,
        numberOfArticles:0
      }],
      isperiodical:true,
      articlearray:[],
      pages:[],
      currentPage:0,
      isNextPage:false,
      isPrevPage:false,
      disabled:true,
      isUserTopics:false
    },
    computed:{
      periodicalarray:function(){
        return this.periodicalArticles.map(x=>x.periodicalId)
      },
      authorarray:function(){
        return this.authorArticles.map(x=>x.authorId)
      },
      isNextPageDisabled:function(){
        return !this.isNextPage
      },
      isPrevPageDisabled:function(){
        return !this.isPrevPage
      }
    },
    watch:{
      userTopics:function(){
        console.log(this.userTopics)
        console.log(this.userTopics.length)
        if(this.userTopics[0] == null || this.userTopics.length == null){
          return this.isUserTopics = false;
        }
        else{
          return this.isUserTopics = true;
        }
      }
    },
  methods:{
    toggle: async function(event, topicId){
      let jsonObj = {
        "topicId":topicId
      }
      dontLoseMe = event.target
      var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, 
        {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
      if(event.target.classList.contains("checkbox")){
        loader.classList.add("is-loader")
        event.target.parentElement.replaceChild(loader, event.target)
      }
      var waitForResponse = await postReq("/api/toggleTopic", jsonObj)
      this.getUserTopics(waitForResponse)
      this.getTopicArticles(waitForResponse).then(()=>{
        if(loader.classList.contains("is-loader")){
          loader.parentElement.replaceChild(dontLoseMe, loader)
        }
        if(event.target.classList.contains("is-loading")){
          event.target.classList.remove("is-loading")
          articleList.activeTopic.isUserTopic = !articleList.activeTopic.isUserTopic
        }
      })
    },
    togglefilter:function(event, filterid){       //This causes persistence issues
                                                  //because periodicalarray, authorarray
                                                  //are computed from periodicalArticles etc.
      var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, 
      {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
      var checkbox = event.target
      event.target.parentElement.replaceChild(loader, event.target)
      var foundInPeriodicals = false
      var foundInAuthors = false
      if(this.isperiodical){
        for(i=0;i<this.periodicalarray.length;i++){
          if(this.periodicalarray[i] == filterid){
            this.periodicalarray.splice(i, 1)
            foundInPeriodicals = true
          }
        }
        if(!foundInPeriodicals){
          this.periodicalarray.push(filterid)
        }
      }
      else{
        for(i=0;i<this.authorarray.length;i++){
          if(this.authorarray[i] == filterid){
            this.authorarray.splice(i, 1)
            foundInAuthors = true
          }
        }
        if(!foundInAuthors){
          this.authorarray.push(filterid)
        }
      }
      var jsonObj = {
        "periodicalIds":this.periodicalarray,
        "authorIds":this.authorarray,
      }
      return articleList.getTopicArticlesFiltered(jsonObj, checkbox, loader)
    },
    getFilterValues: async function(){
      var authors = await postReq("/api/getTopicArticleAuthors")
      articleList.authorArticles = authors
      var periodicals = await postReq("/api/getTopicArticleSources")
      articleList.periodicalArticles = periodicals
    },
    makePages: function(response){
      this.currentPage = 0
      this.pages = []
      for(i=0;i<response.length;i+=PAGE_SIZE){
        if(i+PAGE_SIZE <= response.length){
          var page = []
          for(j=i;j<i + PAGE_SIZE;j++){
            page.push(response[j])
          }
          this.pages.push(page)
        }
        else if(i < response.length){
          var page = []
          for(j=i;j<response.length;j++){
            page.push(response[j])
          }
          this.pages.push(page)
        }
      }
      console.log(this.pages)
      if(this.pages.length > 1){
        this.isNextPage = true
      }
      else{
        this.isNextPage = false
      }
      if(this.pages.length > 0){
        if(this.pages[0].length > 0){
          this.setArticleList(this.pages[0])
        }
      }
      
    },
    getTopicArticles: async function(){
      var response = await getReq('/api/getTopicArticlesWithAllTopics')
      articleList.articles = []
      this.makePages(response)
      this.getFilterValues(response)
    },
    changeArticle:function(article){
      for(i=0;i<this.articles.length;i++){
        if(this.articles[i].articleId == article.articleId){
          this.articles[i] = article
        }
      }
    },
    goNextPage: function(){
      if(!this.isNextPage){
        return
      }
      this.currentPage += 1
      console.log(this.pages)
      this.setArticleList(this.pages[this.currentPage])
      if(this.currentPage < this.pages.length-1){
        this.isNextPage = true
      }
      else{
        this.isNextPage = false
      }
      if(this.currentPage > 0){
        this.isPrevPage = true
      }
      else{
        this.isPrevPage = false
      }
    },
    goPrevPage: function(){
      if(!this.isPrevPage){
        return
      }
      this.currentPage -= 1
      this.setArticleList(this.pages[this.currentPage])
      if(this.currentPage < this.pages.length-1){
        this.isNextPage = true
      }
      else{
        this.isNextPage = false
      }
      if(this.currentPage > 0){
        this.isPrevPage = true
      }
      else{
        this.isPrevPage = false
      }
    },
    setArticleList: function(response){
      articleList.articles = []
      for(i=0;i<response.length;i++){
        var topicsArr = response[i].topic.split("&&&")
        if(response[i].extraTopicName != null){
          var extraTopicsArr = response[i].extraTopicName.split("&&&")
        }
        articleList.articles[i] = {
          title: response[i].title, 
          content: response[i].content, 
          topics: topicsArr,
          extraTopics: extraTopicsArr, 
          author: `${response[i].firstName} ${response[i].lastName}`,
          url: response[i].url,
          periodicalName: response[i].periodicalName, 
          articleId: response[i].articleId,
          authorId: response[i].authorId,
          periodicalId: response[i].periodicalId,
          date: response[i].date.substring(0, 10)}
      }
    },
    getTopicArticlesFiltered: async function(jsonObj, checkbox, loader){
      var response = await postReq('/api/getTopicArticlesFiltered', jsonObj)
      articleList.articles = []
      this.makePages(response)
      loader.parentElement.replaceChild(checkbox, loader)
    },
    enableCheckbox:function(response, event){
      event.target.disabled=false
    },
    getUserTopics: async function(){
      var response = await getReq("/api/getUserTopics")
      var arr = []
      articleList.userTopics = []
      for(i=0;i<response.length;i++){
        arr.push(response[i].name)
        
      }
      articleList.userTopics = arr
    },
    openModal: async function(topic){
      var jsonObj = {
        "topic":topic
      }
      var topicObj = {
        "name":topic
      }
      topicObj.topicArticles = await postReq('/api/getJustOneTopic', jsonObj)
      topicObj.relatedTopics = await postReq('/api/getRelatedTopics', jsonObj)
      topicObj.topicId = topicObj.topicArticles[0].topicId
      var userTopics = await getReq('/api/getUserTopics')
      topicObj.isUserTopic = false;
      for(i=0;i<userTopics.length;i++){
        if(userTopics[i].name == topic){
          topicObj.isUserTopic = true;
        }
      }
      articleList.activeTopic = topicObj
      articleList.showModal = true
    },
    openArticlePreview: async function(item){
      var jsonObj = {}                       
      jsonObj["title"] = item.dataset.val
      var response = await postReq('/api/getJustOneArticleByTitle', jsonObj)
      var topicsArr = response[0].topic.split("&&&")
        if(response[0].extraTopicName != null){
          var extraTopicsArr = response[0].extraTopicName.split("&&&")
        }
        articleList.activeArticle = { 
          title: response[0].title, 
          content: response[0].content, 
          topics: topicsArr,
          extraTopics: extraTopicsArr, 
          author: `${response[0].firstName} ${response[0].lastName}`,
          url: response[0].url,
          periodicalName: response[0].periodicalName, 
          articleId: response[0].articleId,
          authorId: response[0].authorId,
          periodicalId: response[0].periodicalId,
          date: response[i].date.substring(0, 10)
        }
      articleList.showArticleModal = true
    },
    setAuthorsTab:function(){
      if(document.getElementById("periodicalsTab").classList.contains("is-active")){
        document.getElementById("periodicalsTab").classList.remove("is-active")
      }
      if(!document.getElementById("authorsTab").classList.contains("is-active")){
        document.getElementById("authorsTab").classList.add("is-active")
      }
      return this.isperiodical=false
    },
    setPeriodicalsTab:function(){
      if(document.getElementById("authorsTab").classList.contains("is-active")){
        document.getElementById("authorsTab").classList.remove("is-active")
      }
      if(!document.getElementById("periodicalsTab").classList.contains("is-active")){
        document.getElementById("periodicalsTab").classList.add("is-active")
      }
      return this.isperiodical=true
    }
  }
})

document.addEventListener("DOMContentLoaded", async function(){
  var response = await getReq('/api/getTopics')
  for(i=0;i<response.length;i++){
    articleList.topics.push({name:response[i].name, topicId:response[i].topicId})
  }
  console.log(articleList.topics)
  var response2 = await getReq('/api/getUserTopics')
  arr = []
  for(i=0;i<response2.length;i++){
    arr.push(response2[i].name)
  }
  articleList.userTopics = arr
  articleList.getTopicArticles()
  articleList.getFilterValues(response)
})

async function postReq(url='', data={}){
  const response = await fetch(url,{
    method: "POST",
    headers:{
      'Content-Type':'application/json'
    },
    body: JSON.stringify(data)
  })
  
  return response.json()
}

async function getReq(url=''){
  const response = await fetch(url)
  return response.json()
}

function makeLoadingBar(initial, message){
    let articleList = clearAllAndReturn("#articleList")
    let loadStatusText = makeNode("p", [{"className":"subtitle"}, {"innerText":message}, {"id":"loadStatusText"}])
    let dummyText = makeDummyText()
    let loadingBarDiv = makeNode("div", [{"style":"padding: 60px;"}, {"className":"tile is-parent is-vertical box"}, {"id":"loadingBarDiv"}])
    let loadingBar = makeNode("progress", [{"id":"loadingBar"}, {"className":"progress title"}, {"value":initial}, {"textContent":initial}, {"max":"100"}])
    appendThese(loadingBarDiv, [loadingBar, loadStatusText, dummyText]);
    articleList.appendChild(loadingBarDiv)
    isLoadingBar = true;
}

function displayNoArticles() {
  let articleList = clearAllAndReturn("#articleList");
  isLoadingBar = false

  let articleDiv = makeNode("div", [{"className":"tile is-parent is-vertical box"}, {"style":"padding: 60px; text-align: center;"}])
  let articleDivPara = makeNode("p", [{"className":"title is-5"}, {"innerText":"We don't have any articles for you yet!"}])  
  let articleDivParaSub = makeNode("p", [{"className":"subtitle is-6"}, {"innerText":"Pick some topics to get started"}])

  let pencilIconCol = makeNode("p", [{"className":"columns is-centered"}])
  let pencilIcon = makeNode("icon", [{"id":"noteIcon"}, {"className":"icon column is-centered is-large"}, {"innerText":"📝"}])

  let dummyText = makeDummyText()     //Div will shrink unless it's filled, so filling with invisible text JIC

  pencilIconCol.appendChild(pencilIcon);
  appendThese(articleDivPara, [articleDivParaSub, pencilIconCol])
  appendThese(articleDiv, [articleDivPara, dummyText])
  articleList.appendChild(articleDiv);
}


function makeUserArticleHistorySidebar(response) {
  var ul = document.createElement("ul");
  if(response.length == 0){
      return;
  }
  for (var i = 0; i < response.length; i++) {
    let title = makeNode("span", [{"innerText":response[i].title}, {"className":"subtitle"}]);
    let linefeed = document.createElement("br");
    title.appendChild(linefeed);
    let content = makeNode("span", [{"className":"content sidebarBlurb"}, {"innerHTML":"<br/>"}])
    if(response[i].content != null){
      content.innerText = response[i].content.substr(0, 100) + " ... ";
      content.innerHTML += "<br/>"
    }
    let link = makeNode("a", [{"innerHTML":"<br/>Read Again <i class='fas fa-share'></i>"}, {"href":response[i].url}, {"target":"_blank"}])
    let lastViewed = document.createElement("span");
    let date = new Date(response[i].lastViewed);
    lastViewed.innerText = `Read: ${date} `;
    lastViewed.className = "last-viewed";
    let li = document.createElement("li");
    appendThese(li, [title, content, lastViewed, link])
    ul.appendChild(li);
  }

  var userArticleHistoryList = clearAllAndReturn("#recent-articles");
  isLoadingBar = false
  userArticleHistoryList.appendChild(ul);
}


async function openArticle(id, url) {
  let jsonObj = {
    articleId: id,
  };
  var response = await postReq("/api/setUserReadArticle", jsonObj)
  window.open(url, "_blank");
}


function makeDummyText(){                               // Invisible text to prevent the article list from shrinking 
    let dummyText = document.createElement('div')       //    when all the articles are gone. 
    for(i=0;i<65;i++){
      dummyText.textContent += "x"
    }
    dummyText.className = "title";
    dummyText.style.visibility = "hidden"
    return dummyText
}

var xhr;
new autoComplete({
    selector: '#searchBox',
    source: function(term, response){
        try { xhr.abort(); } catch(e){}
        xhr = $.getJSON('/api/searchTitles', { q: term }, function(data){ 
          response(data); 
        });
    },
    onSelect: function(e, b, item){
      console.log(item)
      articleList.openArticlePreview(item)
      document.getElementById('searchBox').addEventListener('click', function(event){
        event.target.addEventListener('click', function(event){
          event.target.value = ""
        },{"once":true})
      },{"once":true})
    },
    minChars: 1

});

//The island of unhappy code

//let date = new Date(response[i].date)
//let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)    // Date is not finite. I think it's a database issue.
//let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
//let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date)
//articleDate.innerText = `${month} ${day} ${year} `;

/* let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date) // Same thing here.
let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date) */
//let date = response[i].lastViewed.substr(0, 10)





