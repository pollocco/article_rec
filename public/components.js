Vue.component('history-sidebar',{
  template:`
  <ul>
    <li v-if="articles.length > 0" v-for="(article, index) in articles" v-bind:key="key(article.articleId, index)">
      <span class="subtitle is-6"><strong>{{article.title}}</strong></span>
      <br/>
      <span v-if="article.content != null" class="content sidebarBlurb">
        {{article.content.substr(0,100) + '...'}}
      </span>
      <br/>
      <span class="last-viewed">
       🕙 <em>{{toLocalTime(article.lastViewed)}}</em>
      </span>
      <br/>
      <a class="read-again" :href="article.url" :id="article.articleId" v-on:click="$emit('setuserarticle', $event, article.articleId)" target="_blank">Read Again &nbsp; <i class='fas fa-share'></i></a>
    </li>
  </ul>
  `,
  props:{
    articles:Array
  },
  methods:{
    key:function(id, index){
      return `history-sidebar-${id}-${index}`
    },
    toLocalTime:function(date){
      return new Date(date).toLocaleString()
    }
  }
})

Vue.component('article-table-row', {
    template: `
    <tr>
      <td>
        {{article.title}}
      </td>
      <td>
        <a :href="article.url">Read</a>
      </td>
      <td>
        {{article.periodicalName}}
      </td>
    </tr>
    `,
    props: {
      article: Object
    }
  })
  
Vue.component('topic-modal', {
  template: `
  <div class="modal">
    <div class="modal-background">
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">
          {{topic.name}}
          </p>
          <button class="delete" aria-label="close" v-on:click="closeModal"></button>
        </header>
        <section class="modal-card-body">
          <div class="relTopicsDiv" v-if="topic.relatedTopics.length > 0">
              <p class="subtitle" style="padding: 1rem; margin-bottom: 0.25rem !important;">
                Related Topics
              </p>
            <div class="tags" style="padding: 1rem; padding-top: 0;">
              <a v-for="relatedTopic in topic.relatedTopics" class="tag is-info is-uppercase" v-on:click="changeModal(relatedTopic.topic)" :value="relatedTopic.topic">
                {{relatedTopic.topic}}
              </a>
            </div>
          </div>
          <p class="subtitle" style="padding: 1rem; margin-bottom: 0.5rem !important;">Articles for {{topic.name}}</p>
          <table class="table">
            <article-table-row v-for="article in topic.topicArticles" :article="article" :key="article.articleId"/>
          </table>
        </section>
        <footer class="modal-card-foot">
          <button v-show="topic.isUserTopic === true" class="button is-danger" :id="topic.name" v-on:click="setToggle">Remove from my list</button>
          <button v-show="topic.isUserTopic === false" class="button is-success" :id="topic.name" v-on:click="setToggle">Add to my list</button>
          <button class="button" v-on:click="closeModal">Close</button>
        </footer>
      </div>
    </div>
  </div>
  `,
  props:{
    topic: Object
  },
  methods:{
    changeModal: async function(topic){
      return articleList.openModal(topic)
    },
    closeModal: function(){
      return articleList.showModal = false;
    },
    setToggle: async function(event){
      var jsonObj = {
        "topicName":event.target.id
      }
      event.target.classList.add("is-loading")
      var topicId = await postReq('/api/getTopicByName', jsonObj)
      thisTopic = topicId[0].topicId
      return articleList.toggleTopic(event, thisTopic)
    }
  }
});

Vue.component('topic-checkbox',{
  template: `
  <input  v-if="topic !== null" 
          class="checkbox" 
          type="checkbox"
          v-on:click="$emit('toggletopic', $event, this.filterId)" 
          :id="topic.topicId" 
          :value="topic.name"
          v-model="usertopics"
          >
  </input>
  `,
  props:{
    topic:Object,
    usertopics:Array
  }
})

Vue.component('filter-checkbox',{
  template: `
  <input v-model="arraymodel"
                :id="filterid"
                v-bind:value="filterid"
                class="checkbox"
                type="checkbox"
                v-on:click="$emit('togglefilter', $event, filterid)">
  </input>
  `,
  props:{
    filterid:Number,
    arraymodel:Array
  }
})

Vue.component('topic-row', {
  template: `
  <tr>
  
    <td v-if="topic !== null">
    <label class="label" :for="key(topic.name, topic.topicId)">
        {{topic.name}}
    </label>
    </td>
    <td v-if="topic !== null">
      <topic-checkbox 
        v-bind:key="topic.topicId" 
        :usertopics="usertopics" 
        :topic="topic" 
        :id="key(topic.name, topic.topicId)"
        v-on:toggletopic="$emit('toggletopic', $event, topic.topicId)"/>
    </td>
  </label>
  </tr>
  `,
  props:{
    topic:Object,
    usertopics:Array
  },
  methods:{
    key: function(item, index){
      return `topic-row-${item}-${index}`
  }
  }
})

Vue.component('filter-row', {
  template: `
  <tr class="table" v-show="checkValid(name)">
  <td>
    <label class="label" :for="key('checkbox', name, filterid)">
        {{name}}
    </label>
  </td>
  <td style="min-width: 2em;">
    <label class="label" :for="key('checkbox', name, filterid)">
        {{numberofarticles}}
    </label>
  </td>
  <td>
      <keep-alive>
          <filter-checkbox 
          v-bind:key="('checkbox', name, filterid)" 
          :filterid="filterid" 
          v-on:togglefilter="$emit('togglefilter', $event, filterid)" 
          :id="key('checkbox', name, filterid)"
          :arraymodel="arraymodel" />
      </keep-alive>
  </td>
  </tr>
  `,
  props:{
    name:String,
    numberofarticles:Number,
    filterid:Number,
    arraymodel:Array
  },
  methods:{
    checkValid:function(name){
      return name.length > 2
    },
    key:function(string, item, index){
      return `filter-row-${string}-${item}-${index}`
    }
  }
})

Vue.component('filter-table', {
  template: `
  <table class="table">
    <filter-row v-for="filter in filters" 
                :name="filter.name"
                :numberofarticles="filter.numberofarticles"
                :filterid="filter.filterid"
                v-on:togglefilter="$emit('togglefilter',$event, filter.filterid)"
                v-bind:key="filter.filterid"
                :arraymodel="arraymodel"/>
  </table>
  `,
  props:{
    filters:Array,
    arraymodel:Array
  }
})

Vue.component('add-topic', {
  template: `
  <span>
    <a  class="tag is-small is-light is-uppercase is-size-7 topicButton" 
        v-show="isaddtopic === false" 
        v-on:click="openAddTopic">
        <i class="fas fa-plus"></i>
    </a>
    <div v-show="isaddtopic === true" id="addTopicDiv">
    <button class="delete" id="addTopicCloseButton" aria-label="close" v-on:click="isaddtopic = false">
    </button>
      <label class="label">
        Why don't you tell me the topic?&nbsp;
      </label>
      <p class="help">
        Since you're so smart all of a sudden...
      </p>
      <div class="field" v-show="selectoradd === 'add'">
        <div class="control">
          <input class="input" type="text" v-model="newtopic" placeholder="Topic name">
          </input>
        </div>
      </div>
      <div class="field" v-show="selectoradd === 'existing'">
        <div class="control">
          <div class="select">
            <select v-model="newtopic">
              <option>Select topic</option>
              <option v-for="topicItem in topiclist" >{{topicItem.name}}</option>
            </select>
          </div>
        </div>
      </div>
      <div class="control">
        <label class="radio">
          <input type="radio" name="selectoradd" v-model="selectoradd" value="add"/>
          Add your own
        </label>
        <label class="radio">
          <input type="radio" name="selectoradd" v-model="selectoradd" value="existing"/>
          Use existing
        </label>
      </div>
      <button class="button is-dark" v-on:click="sendNewTopic" :value="newtopic">Add</button>
      <button class="button" v-on:click="isaddtopic = false">Cancel</button>
    </div>
  </span>
  `,
  props:{
    topiclist: Array,
    isaddtopic: false,
    selectoradd: "",
    articleId: Number,
    articleTopic: String
  },
  data:function(){
    return{
      newtopic: this.newtopic
    } 
  },
  methods:{
    openAddTopic: function(){
      this.selectoradd = "add"
      return this.isaddtopic = true
    },
    sendNewTopic: async function(event){
      event.target.classList.add("is-loading")
      var jsonObj = {
        "newTopic":this.newtopic,
        "articleId":this.articleId,
        "topic":this.articleTopic
      }
      var response = await postReq("/api/addTopic", jsonObj)
      var isAlreadyThere = false
      for(i=0;i<this.topiclist.length;i++){
        if(this.topiclist[i].name == jsonObj.newTopic){
            
          isAlreadyThere = true
        }
      }
      if(!isAlreadyThere){
        articleList.topics.push({"name":this.newtopic, "topicId":response})
      }
      event.target.classList.remove("is-loading")
      this.$emit('changeArticle')
    }
  }
})


Vue.component('article-component', {
  template: `
  <div>
    
    <div class="tile is-parent is-vertical box">
      <li>
      <div v-show="isupdatearticle === false">
        <p class="article-title is-size-5 has-text-weight-bold has-text-dark">
          {{article.title}}&nbsp;&nbsp;
          <a v-on:click="startUpdate" class="is-size-6" style="color: black;">
          <span class="icon is-small">
                <i class="fas fa-edit"></i>
          </span>
          </a>
          <br/>
        </p>
        <p class="article-content is-size-6 has-text-grey-dark">
          {{article.content}}
          
        </p>
      </div>
      <div v-show="isupdatearticle === true">
        <div class="control">
          Title
          <input type="text" class="input" v-model="article.title"></input>
        </div>
        <div class="control">
          URL
          <input type="text" class="input" v-model="article.url"></input>
        </div>
        <div class="control">
          Content
          <textarea class="textarea" cols="100" v-model="article.content"></textarea>
        </div>
        <button class="button is-light" v-on:click="cancelUpdate" style="margin-top: 1rem; ">Cancel</button>
        <button class="button is-dark" v-on:click="updateArticle" style="margin-top: 1rem; margin-left: 1rem;">Save</button>
        
      </div>
      <button class="button is-small" v-show="isupdatearticle === false">
        <a :href="article.url" target="_blank" v-on:click="$emit('setuserarticle', $event, article.articleId)">
          Read &nbsp;&nbsp;
          <span class="icon">
            <i class="fas fa-external-link-alt"></i>
          </span>
        </a>
      </button>
      <br/>
      <span class="author is-size-6 has-text-dark">
      {{article.firstName}} {{article.lastName}}&nbsp;|&nbsp;<span>{{article.periodicalName}}</span>&nbsp;|&nbsp;🗓️&nbsp;{{toLocalDate(article.date)}}
      </span>
      <a  v-for="(topic,index) in article.topics" 
          class="tag is-small is-dark 
          is-uppercase is-size-7 topicButton" 
          :value="topic" 
          v-on:click="openModal(topic)"
          v-bind:key="key('topic', topic, index)">
        {{topic}}
      </a>
      <a v-if="article.extraTopics != null" v-for="(extraTopic,index) in article.extraTopics"  
          class="tag is-small is-light is-uppercase 
          is-size-7 topicButton" 
          :value="extraTopic" 
          v-bind:key="key('extraTopic', extraTopic, index)"
          v-on:click="openModal(extraTopic)">
          {{extraTopic}}
      </a>
      <add-topic v-if="article.topics != null"
                  :topiclist="topiclist" 
                  :articleId="article.articleId" 
                  :articleTopic="article.topics[0]" 
                  :isaddtopic="false" 
                  v-on:changeArticle="changeArticleContent"/>
      </li>
    </div>
  </div>
  `,
  props:{
    article: {
      title:String,
      content:String,
      topics:Array,
      extraTopics:Array,
      firstName:String,
      lastName:String,
      periodicalName:String,
      articleId:Number,
      authorId:Number,
      periodicalId:Number,
      date:String
    },
    topiclist: Array,
    isupdatearticle: Boolean
  },
  methods:{
    openModal: async function(topic){
      return articleList.openModal(topic)
    },
    key: function(string, item, index){
        return `article-${this.article.articleId}-${string}-${item}-${index}`
    },
    toLocalDate:function(date){
      return new Date(date).toDateString()
    },
    changeArticleContent: async function(){
      var jsonObj={
        "title":this.article.title
      }
      var response = await postReq('/api/getJustOneArticleByTitle', jsonObj)
      console.log(response)
      var topicsArr = response[0].topic.split("&&&")
      if(response[0].extraTopicName != null){
        var extraTopicsArr = response[0].extraTopicName.split("&&&")
      }
      await this.$store.dispatch('getUserTopics')
      this.article = { 
        title: response[0].title, 
        content: response[0].content, 
        topics: topicsArr,
        extraTopics: extraTopicsArr, 
        firstName: response[0].firstName,
        lastName: response[0].lastName,
        periodicalName: response[0].periodicalName, 
        articleId: response[0].articleId,
        authorId: response[0].authorId,
        periodicalId: response[0].periodicalId,
        date: response[0].date.substring(0,10),
        url: response[0].url
      }
      this.$emit('changearticle', this.article)
    },
    startUpdate:function(){
      this.isupdatearticle = true
      this.article.oldArticle = {
        "title":this.article.title,
        "content":this.article.content,
        "url":this.article.url
      }
    },
    cancelUpdate:function(){
      this.article.title = this.article.oldArticle.title
      this.article.content = this.article.oldArticle.content
      this.article.url = this.article.oldArticle.url
      this.isupdatearticle = false
      
    },
    updateArticle:async function(){
      var jsonObj={
        "title":this.article.title,
        "content":this.article.content,
        "articleId":this.article.articleId,
        "url":this.article.url
      }
      var response = await postReq('/api/updateArticleTitleContent', jsonObj)
      this.isupdatearticle = false
      return this.changeArticleContent(response)
      
    }
  }
})

Vue.component('article-preview', {
  template:`
  <div class="modal">
    <div class="modal-background">
      <div class="modal-card">
        <div class="modal-card-head">
          <p class="modal-card-title"> 
            View Article
          </p>
          <button class="delete" aria-label="close" v-on:click="closeArticleModal"></button>
        </div>
        <section class="modal-card-body">
          <div class="singleArticleDiv">
            <span class="title">{{article.title}}</span>
            &nbsp;
            <span>
              <a v-for="(topic,index) in article.topics" 
                class="tag is-small is-info
                is-uppercase is-size-7 topicButton" 
                :value="topic" 
                v-on:click="changeToTopics(topic)"
                v-bind:key="key('article-preview-topic', topic, index)">
              {{topic}}
              </a>
              <add-topic :topiclist="topiclist" 
                          :articleId="article.articleId" 
                          :articleTopic="article.topics[0]" 
                          :isaddtopic="false" 
                          v-on:changeArticle="changeArticleContent"/>
            </span>
            <p class="articleContent" style="padding: 20px;">{{article.content}} <a style="padding-right: 20px;" target="_blank" :href="article.url">
            Read
          </a></p>
            <span class="subtitle is-6">
              {{article.author}} 
              &nbsp;|&nbsp; 
              {{article.periodicalName}} 
              &nbsp;|&nbsp; 
              {{article.date}}
              
            </span>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-light" v-on:click="closeArticleModal">
            Close
          </button>
        </footer>
      </div>
    </div>
  </div>
  `,
  props:{
    article:Object,
    topiclist:Array,

  },
  methods:{
    key:function(string, item, index){
      return `${string}-${item}-${index}`
    },
    changeToTopics: function(topic){
      articleList.showArticleModal = false
      return articleList.openModal(topic)
    },
    closeArticleModal: function(){
      return articleList.showArticleModal = false 
    },
    changeArticleContent: async function(){
      var jsonObj={
        "title":this.article.title
      }
      var response = await postReq('/api/getJustOneArticleGeneric', jsonObj)
      var topicsArr = response[0].topic.split("&&&")
      await this.$store.dispatch('getUserTopics')
      this.article = { 
        title: response[0].title, 
        content: response[0].content, 
        topics: topicsArr,
        author: `${response[0].firstName} ${response[0].lastName}`,
        periodicalName: response[0].periodicalName, 
        articleId: response[0].articleId,
        authorId: response[0].authorId,
        periodicalId: response[0].periodicalId,
        date: response[0].date.substring(0,10),
        url: response[0].url
      }
    }
  }
})