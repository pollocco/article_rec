// IMPORTANT NOTE: Mind the capitalization for some function names. Some are fully lower-case; those are the ones
//                 that end up being referred to in HTML (which is case-insensitive, ergo Vue won't recognize
//                 the function trying to be called if its declared as camelCase).

// history-sidebar: "Article last read" component, bottom-right corner.

Vue.component('history-sidebar',{       
  template:`
  <ul>
    <li v-if="articles.length > 0" v-for="(article, index) in articles" v-bind:key="key(article.articleId, index)">
      <span class="subtitle is-6"><strong>{{article.title}}</strong></span>
      <span v-if="article.content != null" class="content sidebarBlurb">
        <br/>
        {{article.content.substr(0,100) + '...'}}
      </span>
      <br/>
      <span class="last-viewed">
       🕙 {{toLocalTime(article.lastViewed)}}
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
      // Generates unique key, necessary for Vue to keep its children straight.                
      return `history-sidebar-${id}-${index}`
    },
    toLocalTime:function(date){
      return new Date(date).toLocaleString()
    }
  }
})

// article-table-row is for the topic-modal component, NOT the regular list of articles.

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
  
// Modal component that gets displayed when a topic is clicked.

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
    changeModal: async function(topic){               // Changes the topic for the modal, such as when a user clicks
      return articleList.openTopicModal(topic)             // a new topic within the modal.
    },
    closeModal: function(){
      return articleList.showTopicModal = false;
    },
    setToggle: async function(event){                 // setToggle will add or remove topic from user's list
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

// Checkbox for individual topic in topic list at top-right. 
// When clicked, alerts the parent component topic-row
// which alerts its parent etc. eventually leading to articleList.toggleTopic()

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

// Row for topic in the upper-right topic's table. Contains name and the topic-checkbox component.

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

// Components that compose table of filters: checkbox, row, table.
// Very similar set-up compared to topic table, except the table itself is
// also a Vue component (whereas for topic table the table is declared in plain HTML
// in home.handlebars).

// "arraymodel" here is (periodicalArticles || authorArticles).map(x=>x.id).
// It's kept seperately from the original arrays (periodicalArticles/authorArticles)
// so that when values are spliced from arraymodel in Vuex store (in script.js),
// the checkboxes don't disappear entirely as would happen if we did that to the 
// original arrays.

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



// Used for adding a topic via the "+" icon in article-component as well as article-preview.

Vue.component('add-topic', {
  template: `
  <span>
    <div :id="key('add-topic-div', articleId)" class="addTopicDiv">
    <button class="delete" id="addTopicCloseButton" aria-label="close" v-on:click="closeaddtopic">
    </button>
      <label class="label">
        What's a good topic for this? &nbsp;
      </label>
      <div class="field" v-show="selectoradd === 'add'">
        <div class="control">
          <input class="input" type="text" v-model="newtopic" placeholder="Topic name">
          </input>
        </div>
      </div>
      <div class="field" v-show="selectoradd === 'existing'">
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="newtopic">
              <option :value="null" disabled>Select topic</option>
              <option v-for="topicItem in topiclist" >{{topicItem.name}}</option>
            </select>
          </div>
        </div>
      </div>
      <div class="control">
        <label class="radio">
          <input type="radio" id="add" v-model="selectoradd" value="add"></input>
          Add your own
        </label>
        <label class="radio">
          <input type="radio" id="existing" v-model="selectoradd" value="existing"></input>
          
          Use existing
        </label>
      </div>
      <button class="button is-dark" v-on:click="sendNewTopic" :value="newtopic">Add</button>
      <button class="button" v-on:click="closeaddtopic">Cancel</button>
    </div>
  </span>
  `,
  props:{
    topiclist: Array,
    articleId: Number,
    articleTopic: String,
    selectoradd: ""
  },
  data:function(){
    return{
      newtopic: null
    } 
  },
  methods:{
    key:function(string, id){
      return `${string}-${id}`
    },
    closeaddtopic:function(){
      this.$emit('closeaddtopic')
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

Vue.component('add-topic-button',{
  template:`
  <button :id="key('add-topic-button', articleId)" class="addTopicButton tag is-small is-light is-uppercase is-size-7 topicButton" 
    v-on:click="openaddtopic">
    <i class="fas fa-plus"></i>
  </button>
  `,
  props:{
    articleId:Number
  },
  methods:{
    key:function(string, id){
      return `${string}-${id}`
    },
    openaddtopic:function(){
      this.$emit('openaddtopic')
    }
  }
})

// The articles that show up in the main list. 

Vue.component('article-component', {
  template: `
  <div>
    
    <div class="tile is-parent is-vertical box" :id="divKey('article-parent-div', article.articleId)">
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
          {{article.content}} &nbsp;
          <a :href="article.url" target="_blank" v-show="isupdatearticle === false" v-on:click="$emit('setuserarticle', $event, article.articleId)">
          Read 
          <span class="icon">
            <i class="fas fa-external-link-alt"></i>
          </span>
        </a>
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
        <button class="button is-dark" v-on:click="updateArticle" style="margin-top: 1rem; ">Save</button>
        <button class="button" v-on:click="cancelUpdate" style="margin-top: 1rem; margin-left: 0.5rem;">Cancel</button>
        
      </div>
      <span class="author is-size-6 has-text-dark">
      {{article.firstName}} {{article.lastName}}&nbsp;|&nbsp;<span>{{article.periodicalName}}</span>&nbsp;|&nbsp;🗓️&nbsp;{{toLocalDate(article.date)}}
      </span>
      <br/>
      <br/>
        <div class="field is-grouped is-grouped-multiline">
          <span class="tags has-addons" v-for="(topic,index) in article.topics" >
            <button  
                class="tag is-small is-dark is-uppercase is-size-7 topicButton" 
                :value="topic" 
                v-on:click="openTopicModal(topic)"
                v-bind:key="key('topic', topic, index)">
              {{topic}}
            </button>
            <button class="tag is-delete topicButton" v-if="article.topics.length > 1" v-on:click="deleteTopic(topic)"></button>
            </span>
          <span class="tags has-addons" v-for="(extraTopic,index) in article.extraTopics"  v-if="article.extraTopics != null"> 
            <button class="tag is-small is-light is-uppercase 
                is-size-7 topicButton" 
                :value="extraTopic" 
                v-bind:key="key('extraTopic', extraTopic, index)"
                v-on:click="openTopicModal(extraTopic)">
                {{extraTopic}}
            </button>
            <button class="tag is-delete topicButton" v-on:click="deleteTopic(extraTopic)"></button>
          </span>
          <span>
            <add-topic-button v-if="article.topics != null"
            :articleId="article.articleId"
            v-bind:key="key('add-topic-button', article.articleId, 0)"
            v-show="!isaddtopic"
            v-on:openaddtopic="setAddTopic(true)"
            />
            
          </span>
        </div>
        <add-topic v-show="isaddtopic" v-on:changeArticle="changeArticleContent"
          v-on:closeaddtopic="setAddTopic(false)"
          :selectoradd='"add"'
          v-bind:key="key('add-topic-parent', article.articleId, 1)"
          :topiclist="topiclist" 
          :articleId="article.articleId" 
          :articleTopic="article.topics[0]" />
        
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
    isupdatearticle: Boolean,
    isaddtopic: Boolean
  },
  methods:{
    divKey:function(string, id){
      return `${string}-${id}`
    },
    deleteTopic:async function(topic){
      var jsonObj = {
        "articleId":this.article.articleId,
        "topic":topic
      }
      var response = await postReq("/api/deleteTopic", jsonObj)
      return this.changeArticleContent(response)
    },
    openTopicModal: async function(topic){        
      // Opens the topic modal when one of the topic tags is clicked.     
      return articleList.openTopicModal(topic)
    },
    setAddTopic:function(bool){
      if(bool == true){
        setTimeout(()=>{addEventListener("click",(e)=>{
          if(document.getElementById(`add-topic-div-${this.article.articleId}`)  == null ){
            return
          }
          else if(!(document.getElementById(`add-topic-div-${this.article.articleId}`).contains(e.target))
            && !(document.getElementById(`article-parent-div-${this.article.articleId}`).contains(e.target))){
            return this.isaddtopic = false
          }
          
        })}, 100)
      }
      
      return this.isaddtopic = bool
    },
    key: function(string, item, index){   
      // Unique key generator, used in v-bind:key which is how Vue tracks list elements.        
      return `article-${this.article.articleId}-${string}-${item}-${index}`
    },
    toLocalDate:function(date){
      return new Date(date).toDateString()
    },
    changeArticleContent: async function(){ 
      // Updates *just* the article being modified, such as when a topic is added,   
      // or the title/content/URL are changed by user. Reason for this is so  
      // the entire list doesn't have to reload and cause the user 
      // to lose their place every time they change something.
      var jsonObj={                                
        "title":this.article.title                
      }                                           
      var response = await postReq('/api/getJustOneArticleByTitle', jsonObj)
      var topicsArr = response[0].topic.split("&&&")
      var extraTopicsArr = null
      if(response[0].extraTopicName != null){
        extraTopicsArr = response[0].extraTopicName.split("&&&")
      }
      await this.$store.dispatch('getUserTopics')
      var newArticle = { 
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

      // Here, Object.assign(old, new) changes the object as it's stored in the component. Without it, a change in rendering 
      // resets the values of the component (example: deleting a topic and then opening a topic modal would cause the
      // deleted tag to be reinstated.) 

      Object.assign(this.article, newArticle)

      // this.$emit(...) alerts Vuex store and sends modified article up the chain so it can be switched
      // in the article array.
      this.$emit('changearticle', this.article)   
    },
    // startUpdate and cancelUpdate are triggered when the user clicks the 'edit' button for an article.                                           
    startUpdate:function(){
      this.isupdatearticle = true   
      // oldArticle saves the previous article information, in the event the action is canceled.              
      this.article.oldArticle = {   
        "title":this.article.title,
        "content":this.article.content,
        "url":this.article.url
      }
    },
    cancelUpdate:function(){
      // Restores article to initial values if user chooses to cancel update.
      this.article.title = this.article.oldArticle.title
      this.article.content = this.article.oldArticle.content
      this.article.url = this.article.oldArticle.url
      this.isupdatearticle = false
      
    },
    updateArticle:async function(){
      // Triggered after user clicks 'save' when editing article. Because the input boxes are two-way bound using Vue's v-model,
      // the values for article.title, article.content etc.. are updated as the user types them, which is why they can
      // be referred to as the original object properties in jsonObj.
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

// Modal that's displayed after clicking result in search box.
// Note that the topics are generic and aren't colored according to 
// whether they're in the user list. This is because the search box
// searches *all* articles, so the results can't be restricted to just
// the user's topic articles.

Vue.component('article-preview', {
  template:`
  <div class="modal" id="key('article-preview-modal', article.articleId, 0)">
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
              <add-topic-button v-if="article.topics != null"
                :articleId="article.articleId"
                v-bind:key="key('add-topic-preview-button', article.articleId, 0)"
                v-show="!isaddtopic"
                v-on:openaddtopic="setAddTopic(true)"
              />
              <add-topic v-show="isaddtopic" v-on:changeArticle="changeArticleContent"
                v-on:closeaddtopic="setAddTopic(false)"
                :selectoradd='"add"'
                v-bind:key="key('add-topic-preview-parent', article.articleId, 1)"
                :topiclist="topiclist" 
                :articleId="article.articleId" 
                :articleTopic="article.topics[0]" />
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
    isaddtopic:Boolean
  },
  methods:{
    key:function(string, item, index){
      return `${string}-${item}-${index}`
    },
    changeToTopics: function(topic){            
      // For when user clicks on a topic tag within the article preview.
      articleList.showArticleModal = false
      return articleList.openTopicModal(topic)
    },
    closeArticleModal: function(){
      return articleList.showArticleModal = false 
    },
    setAddTopic:function(bool){
      if(bool == true){
        setTimeout(()=>{addEventListener("click",(e)=>{
          if(document.getElementById(`article-preview-modal-${this.article.articleId}-0`)  == null ){
            return
          }
          else if(!(document.getElementById(`add-topic-div-${this.article.articleId}`).contains(e.target))
            && !(document.getElementById(`article-preview-modal-${this.article.articleId}-0`).contains(e.target))){
            return this.isaddtopic = false
          }
          
        })}, 100)
      }
      return this.isaddtopic = bool
    },
    changeArticleContent: async function(){
      // Used when user adds a new topic to an article within the preview modal.
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