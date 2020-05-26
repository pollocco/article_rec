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

// Vuex is a plugin for Vue that makes changing state more straightforward
// by employing a "store", which is just a collection of the elements that
// are bound to be mutated in some way. The mutations are always done
// via the methods in "mutations" and are SYNCHRONOUS (can't do server calls).
// The way around this is by creating "actions", which can then commit
// mutations after the async call is made.  

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
      // This is called when an article is changed by a user (topic added, changed title, etc..)
      
      var thisPage = state.pages[state.currentPage]
      article.topic = ""

      // The following two loops "revert" the topics and extraTopics arrays back to "&&&" separated
      // strings. Reason for this is because they're getting placed back within the pages array
      // and will be treated as if they came straight from the server when the page gets changed.

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
          thisPage[i] = article
        }
      }
    },
    changeArticles(state, response){
      // This changes the displayed article list when the page is changed via
      // makePages, goNextPage, goPrevPage.
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
    // togglePeriodicalArrayValue/toggleAuthorArrayValue cuts out or adds a specific periodical/author
    // from periodicalarray/authorarray based on the filterId given from a checkbox 'click' event.
    togglePeriodicalArrayValue(state, x){
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
    toggleAuthorArrayValue(state, x){
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
      // Chops the list of articles from the server into pages of PAGE_SIZE length.
      // Uses changeArticles to modify the actual displayed list.
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
        // Article that's currently occupying the 'article-preview' modal
        // that gets triggered from the searchbox.
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
      showTopicModal: false,
      showArticleModal:false,
      isperiodical:true,
      articlearray:[],
      disabled:true,
      isUserTopics:false
    },
    computed:{
      // Fetches values from the Vuex store so that they can be referenced in the methods here.
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
        // Checks if there's any user topics (and therefore any articles to display).
        // This value is used to determine whether the "no articles" placeholder (in home.handlebars)
        // is displayed.
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

      // 'loader' is switched out with the checkbox so the user
      // can't continue to change the value while the server gets 
      // updated.

      var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, 
        {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
      if(event.target.classList.contains("checkbox")){
        loader.classList.add("is-loader")
        event.target.parentElement.replaceChild(loader, event.target)
      }

      var waitForResponse = await postReq("/api/toggleTopic", jsonObj)
      store.dispatch('getUserTopics')

      // Passing waitForResponse to getTopicArticles so that the function
      // doesn't fire before the user's topics are updated.

      this.getTopicArticles(waitForResponse).then(()=>{

        // Replace loader element with the original checkbox once
        // all the changes are made.

        if(loader.classList.contains("is-loader")){
          loader.parentElement.replaceChild(originalCheckbox, loader)
        }
        if(event.target.classList.contains("is-loading")){
          event.target.classList.remove("is-loading")
          articleList.activeTopic.isUserTopic = !articleList.activeTopic.isUserTopic
        }
      })
    },
    toggleFilter:function(event, filterid){     
      var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, 
      {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
      var checkbox = event.target
      event.target.parentElement.replaceChild(loader, event.target)

      // If the periodical table is the "active" table, then remove the given ID from that array.
      // Otherwise it was picked from the author table, so remove it from there.

      if(this.isperiodical){
        store.commit('togglePeriodicalArrayValue', filterid)
      }
      else{
        store.commit('toggleAuthorArrayValue', filterid)
      }

      // Takes the array models from both filter tables, and then grabs the articles that are
      // a.) in the user's topic articles, b.) have those authors/periodicals

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
    setUserArticle:async function(event, articleId){
      // Sets an article as "read" after user clicks on the external link.
      let jsonObj = {
        "articleId":articleId
      }
      var response = await postReq('/api/toggleUserArticle', jsonObj).then(()=>{
        store.dispatch('getUserArticles')
      })

    },
    getTopicArticles: async function(){
      // Gets all articles that match the user's chosen topics.
      var response = await getReq('/api/getTopicArticlesWithAllTopics')
      store.dispatch('makePages', response)
      this.getFilterValues(response)
    },
    getTopicArticlesFiltered: async function(jsonObj, checkbox, loader){
      // Gets *filtered* articles based on the periodicalarray and authorarray
      // values passed in by toggleFilter.
      var response = await postReq('/api/getTopicArticlesFiltered', jsonObj)
      store.dispatch('makePages', response)
      loader.parentElement.replaceChild(checkbox, loader)
    },
    changeArticle:function(article){
      // Passes changeArticle event to Vuex mutator.
      store.commit('changeArticle', article)
    },
    goNextPage(){
      store.dispatch('goNextPage')
    },
    goPrevPage(){
      store.dispatch('goPrevPage')
    },
    openTopicModal: async function(topic){
      var jsonObj = {
        "topic":topic
      }
      var topicObj = {
        "name":topic
      }
      // getJustOneTopic returns all articles for a topic,
      // and getRelatedTopics gets all TopicTopics for a topic.
      topicObj.topicArticles = await postReq('/api/getJustOneTopic', jsonObj)
      topicObj.relatedTopics = await postReq('/api/getRelatedTopics', jsonObj)
      topicObj.topicId = topicObj.topicArticles[0].topicId
      store.dispatch('getUserTopics').then(()=>{
        topicObj.isUserTopic = false;
        for(i=0;i<this.userTopics.length;i++){
          if(this.userTopics[i] == topic){        // Affects whether the button at the bottom of the modal
            topicObj.isUserTopic = true;          // reads "add to my topics" or "remove from my topics".
          }
        }
        articleList.activeTopic = topicObj
        articleList.showTopicModal = true
      })
      
    },
    openArticlePreview: async function(item){
      // Opens the article-preview modal and sets the article to be displayed.
      // getJustOneArticleGeneric is used because *all* articles are being searched,
      // therefore we don't want a list specific to the user's topics.
      var jsonObj = {}                       
      jsonObj["title"] = item.dataset.val
      var response = await postReq('/api/getJustOneArticleGeneric', jsonObj)  
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
    // setAuthorsTab and setPeriodicalsTab simply change which tab is highlighted
    // when switching between the filters in the dropdown.
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
  // First, grab all the topics to populate the topic checklist.
  var response = await getReq('/api/getTopics')
  for(i=0;i<response.length;i++){
    articleList.topics.push({name:response[i].name, topicId:response[i].topicId})
  }
  // Then get the user topics in order to check those boxes.
  store.dispatch('getUserTopics')
  // Then get the user's article history for the history-sidebar.
  store.dispatch('getUserArticles')
  // Then get the articles based on the user's topics.
  articleList.getTopicArticles()
  // Then get the filter values ('response' isn't used in getFilterValues, only there so program knows to wait until
  // response is returned).
  articleList.getFilterValues(response)
})



// Autocomplete for article search. Uses auto-complete.min.js which was obtained from 
// here: https://goodies.pixabay.com/javascript/auto-complete/demo.html 
// All credit to Pixabay.com for the resulting functionality.

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





