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

Vue.use(Vuex)

const store = new Vuex.Store({
  state:{
    periodicalArticles:[],
    authorArticles:[],
    authorarray:[],
    periodicalarray:[],
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
    pages:[],
    userArticles:[{}],
    userTopics:[],
    isNextPage:false,
    isPrevPage:false
  },
  mutations:{
    changePeriodicals(state, array){
      state.periodicalArticles = array
      state.periodicalarray = array.map(x=>x.periodicalId)
    },
    changeAuthors(state, array){
      state.authorArticles = array
      state.authorarray = array.map(x=>x.authorId)
    },
    changeUserArticles(state, array){
      state.userArticles = array
    },
    changeArticle(state, article){
      var thisPage = state.pages[state.currentPage]
      article.topic = ""
      for(i=0;i<article.topics.length;i++){
        article.topic += article.topics[i]
        if(article.topics.length - i > 1){
          article.topic += "&&&"
        }
        
      }
      
      if(article.extraTopics != null){
        article.extraTopicName = ""
        for(i=0;i<article.extraTopics.length;i++){
          article.extraTopicName += article.extraTopics[i]
          if(article.extraTopics.length - i > 1){
            article.extraTopicName += "&&&"
          }
          
        }
      }
      
      for(i=0;i<thisPage.length;i++){
        if(thisPage[i].articleId == article.articleId){
          console.log("found it")
          thisPage[i] = article
        }
      }
    },
    changeArticles(state, response){
      var newArticles = []
      for(i=0;i<response.length;i++){
        let topicsArr = response[i].topic.split("&&&")
        var isExtraTopics = false
        if(response[i].extraTopicName != null){
          var extraTopicsArr = response[i].extraTopicName.split("&&&")
          isExtraTopics = true
        }
        newArticles[i] = {
          title: response[i].title, 
          content: response[i].content, 
          topics: topicsArr,
          firstName: response[i].firstName,
          lastName: response[i].lastName,
          url: response[i].url,
          periodicalName: response[i].periodicalName, 
          articleId: response[i].articleId,
          authorId: response[i].authorId,
          periodicalId: response[i].periodicalId,
          date: response[i].date.substring(0, 10)
        }
        if(isExtraTopics){
          newArticles[i].extraTopics = extraTopicsArr
        }
      }
      state.articles = newArticles
    },
    changeUserTopics(state, array){
      state.userTopics = array
    },
    removeFromPeriodicals(state, x){
      var foundInPeriodicals = false
      for(i=0;i<state.periodicalarray.length;i++){
        if(state.periodicalarray[i] == x){
          state.periodicalarray.splice(i, 1)
          foundInPeriodicals = true
        }
      }
      if(!foundInPeriodicals){
        state.periodicalarray.push(x)
      }
    },
    removeFromAuthors(state, x){
      var foundInAuthors = false
      for(i=0;i<state.authorarray.length;i++){
        if(state.authorarray[i] == x){
          state.authorarray.splice(i, 1)
          foundInAuthors = true
        }
      }
      if(!foundInAuthors){
        state.authorarray.push(x)
      }
    },
    pushToPages(state, x){
      state.pages.push(x)
    },
    changePages(state, array){
      state.pages = array
    },
    changeCurrentPage(state, x){
      state.currentPage = x
    },
    changeIsNextPage(state, bool){
      state.isNextPage = bool
    },
    changeIsPrevPage(state, bool){
      state.isPrevPage = bool
    }
  },
  actions:{
    async getNewPeriodicals({commit}){
      var periodicals = await postReq("/api/getTopicArticleSources")
      commit('changePeriodicals', periodicals)
    },

    async getNewAuthors({commit}){
      var authors = await postReq("/api/getTopicArticleAuthors")
      commit('changeAuthors', authors)
    },

    async getUserTopics({commit}){
      var newUserTopics = await getReq("/api/getUserTopics")
      var arr = []
      for(i=0;i<newUserTopics.length;i++){
        arr.push(newUserTopics[i].name)
      }
      commit('changeUserTopics', arr)
    },

    async getUserArticles({commit}){
      var history = await getReq('/api/getUserArticlesHistory').catch(e=>{console.log(e)})
      commit('changeUserArticles', history)
    },

    makePages({commit, state}, response){
      commit('changeCurrentPage', 0)
      commit('changePages', [])
      for(i=0;i<response.length;i+=PAGE_SIZE){
        if(i+PAGE_SIZE <= response.length){
          var page = []
          for(j=i;j<i + PAGE_SIZE;j++){
            page.push(response[j])
          }
          commit('pushToPages', page)
        }
        else if(i < response.length){
          var page = []
          for(j=i;j<response.length;j++){
            page.push(response[j])
          }
          commit('pushToPages', page)
        }
      }
      if(state.pages.length > 1){
        commit('changeIsNextPage', true)
      }
      else{
        commit('changeIsNextPage', false)
      }
      if(state.pages.length > 0){
        if(state.pages[0].length > 0){
          commit('changeArticles', state.pages[0])
        }
      }
      console.log(state.pages)
    },

    goNextPage({commit, state}){
      if(!state.isNextPage){
        return
      }
      commit('changeCurrentPage', state.currentPage + 1)
      commit('changeArticles', state.pages[state.currentPage])
      if(state.currentPage < state.pages.length-1){
        commit('changeIsNextPage', true)
      }
      else{
        commit('changeIsNextPage', false)
      }
      if(state.currentPage > 0){
        commit('changeIsPrevPage', true)
      }
      else{
        commit('changeIsPrevPage', false)
      }
    },

    goPrevPage({commit, state}){
      if(!state.isPrevPage){
        return
      }
      commit('changeCurrentPage', state.currentPage - 1)
      store.commit('changeArticles', state.pages[state.currentPage])
      if(state.currentPage < state.pages.length-1){
        commit('changeIsNextPage', true)
      }
      else{
        commit('changeIsNextPage', false)
      }
      if(state.currentPage > 0){
        commit('changeIsPrevPage', true)
      }
      else{
        commit('changeIsPrevPage', false)
      }
    },

  }
})



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
  store,
  data: {
      topics:[],
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
      isperiodical:true,
      articlearray:[],
      disabled:true,
      isUserTopics:false
    },
    computed:{
      authorarray:function(){
        return store.state.authorarray
      },
      periodicalarray:function(){
        return store.state.periodicalarray
      },
      periodicalArticles:function(){
        return store.state.periodicalArticles
      },
      authorArticles:function(){
        return store.state.authorArticles
      },
      userArticles:function(){
        return store.state.userArticles
      },
      articles:function(){
        return store.state.articles
      },
      userTopics:function(){
        return store.state.userTopics
      },
      isNextPageDisabled:function(){
        return !store.state.isNextPage
      },
      isPrevPageDisabled:function(){
        return !store.state.isPrevPage
      }
    },
    watch:{
      userTopics:function(){
        if(this.userTopics[0] == null || this.userTopics.length == null){
          return this.isUserTopics = false;
        }
        else{
          return this.isUserTopics = true;
        }
      }
    },
  methods:{
    toggleTopic: async function(event, topicId){
      let jsonObj = {
        "topicId":topicId
      }
      originalCheckbox = event.target
      var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, 
        {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
      if(event.target.classList.contains("checkbox")){
        loader.classList.add("is-loader")
        event.target.parentElement.replaceChild(loader, event.target)
      }
      var waitForResponse = await postReq("/api/toggleTopic", jsonObj)
      store.dispatch('getUserTopics')
      this.getTopicArticles(waitForResponse).then(()=>{
        if(loader.classList.contains("is-loader")){
          loader.parentElement.replaceChild(originalCheckbox, loader)
        }
        if(event.target.classList.contains("is-loading")){
          event.target.classList.remove("is-loading")
          articleList.activeTopic.isUserTopic = !articleList.activeTopic.isUserTopic
        }
      })
    },
    setUserArticle:async function(event, articleId){
      let jsonObj = {
        "articleId":articleId
      }
      var response = await postReq('/api/toggleUserArticle', jsonObj).then(()=>{
        store.dispatch('getUserArticles')
      })

    },
    toggleFilter:function(event, filterid){     
      var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, 
      {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
      var checkbox = event.target
      event.target.parentElement.replaceChild(loader, event.target)
      if(this.isperiodical){
        store.commit('removeFromPeriodicals', filterid)
      }
      else{
        store.commit('removeFromAuthors', filterid)
      }
      var jsonObj = {
        "periodicalIds":store.state.periodicalarray,
        "authorIds":store.state.authorarray,
      }
      return articleList.getTopicArticlesFiltered(jsonObj, checkbox, loader)
    },
    getFilterValues: async function(){
      await store.dispatch('getNewAuthors')  
      await store.dispatch('getNewPeriodicals')
    },
    getTopicArticles: async function(){
      var response = await getReq('/api/getTopicArticlesWithAllTopics')
      store.dispatch('makePages', response)
      this.getFilterValues(response)
    },
    changeArticle:function(article){
      store.commit('changeArticle', article)
    },
    goNextPage(){
      store.dispatch('goNextPage')
    },
    goPrevPage(){
      store.dispatch('goPrevPage')
    },
    getTopicArticlesFiltered: async function(jsonObj, checkbox, loader){
      var response = await postReq('/api/getTopicArticlesFiltered', jsonObj)
      store.dispatch('makePages', response)
      loader.parentElement.replaceChild(checkbox, loader)
    },
    enableCheckbox:function(response, event){
      event.target.disabled=false
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
      store.dispatch('getUserTopics').then(()=>{
        topicObj.isUserTopic = false;
        for(i=0;i<this.userTopics.length;i++){
          if(this.userTopics[i] == topic){
            topicObj.isUserTopic = true;
          }
        }
        articleList.activeTopic = topicObj
        articleList.showModal = true
      })
      
    },
    openArticlePreview: async function(item){
      var jsonObj = {}                       
      jsonObj["title"] = item.dataset.val
      var response = await postReq('/api/getJustOneArticleGeneric', jsonObj)
      console.log(response)
      var topicsArr = response[0].topic.split("&&&")
      articleList.activeArticle = { 
        title: response[0].title, 
        content: response[0].content, 
        topics: topicsArr, 
        author: `${response[0].firstName} ${response[0].lastName}`,
        url: response[0].url,
        periodicalName: response[0].periodicalName, 
        articleId: response[0].articleId,
        authorId: response[0].authorId,
        periodicalId: response[0].periodicalId,
        date: response[0].date.substring(0, 10)
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
  store.dispatch('getUserTopics')
  store.dispatch('getUserArticles')
  articleList.getTopicArticles()
  articleList.getFilterValues(response)
})



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





