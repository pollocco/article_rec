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
        event.target.id = topicId[0].topicId
        return articleList.toggle(event)
      }
    }
  });
  
  Vue.component('topic-checkbox',{
    template: `
    <input  v-if="topic !== null" 
            class="checkbox" 
            type="checkbox"
            v-on:click="$emit('toggle', $event, this.filterId)" 
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
          v-on:toggle="$emit('toggle', $event, topic.topicId)"/>
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
        console.log(this)
        event.target.classList.add("is-loading")
        var jsonObj = {
          "newTopic":this.newtopic,
          "articleId":this.articleId,
          "topic":this.articleTopic
        }
        var response = await postReq("/api/addTopic", jsonObj)
        var isAlreadyThere = false
        console.log(this.topiclist)
        console.log(this.topiclist.length)
        for(i=0;i<this.topiclist.length;i++){
            console.log(this.topiclist[i])
              console.log(jsonObj)
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
    <div class="tile is-parent is-vertical box">
      <li>
      <p class="article-title is-size-5 has-text-weight-bold has-text-dark">
        {{article.title}}&nbsp;
      </p>
      <p class="article-content is-size-6 has-text-grey-dark">
        {{article.content}}
      </p>
      <button class="button is-small">
        <a :href="article.url" target="_blank">
          Read &nbsp;&nbsp;
          <span class="icon">
            <i class="fas fa-external-link-alt"></i>
          </span>
        </a>
      </button>
      <br/>
      <span class="author is-size-6 has-text-dark">
        {{article.author}}&nbsp;|&nbsp;<span class="is-uppercase">{{article.periodicalName}}</span>&nbsp;|&nbsp;{{article.date}}
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
    `,
    props:{
      article: {
        title:String,
        content:String,
        topics:Array,
        extraTopics:Array,
        author:String,
        periodicalName:String,
        articleId:Number,
        authorId:Number,
        periodicalId:Number,
        date:String
      },
      topiclist: Array
    },
    methods:{
      openModal: async function(topic){
        return articleList.openModal(topic)
      },
      key: function(string, item, index){
          return `article-${this.article.articleId}-${string}-${item}-${index}`
      },
      changeArticleContent: async function(){
        var jsonObj={
          "title":this.article.title
        }
        var response = await postReq('/api/getJustOneArticleByTitle', jsonObj)
        var topicsArr = response[0].topic.split("&&&")
        if(response[0].extraTopicName != null){
          var extraTopicsArr = response[0].extraTopicName.split("&&&")
        }
        await articleList.getUserTopics()
        this.article = { 
          title: response[0].title, 
          content: response[0].content, 
          topics: topicsArr,
          extraTopics: extraTopicsArr, 
          author: `${response[0].firstName} ${response[0].lastName}`,
          periodicalName: response[0].periodicalName, 
          articleId: response[0].articleId,
          authorId: response[0].authorId,
          periodicalId: response[0].periodicalId,
          date: response[0].date.substring(0,10)
        }
        this.$emit('changearticle', this.article)
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
              <a style="padding-right: 20px;" target="_blank" :href="article.url">
                Read
              </a>
              <span>
                <a v-for="(topic,index) in article.topics" 
                  class="tag is-small is-dark 
                  is-uppercase is-size-7 topicButton" 
                  :value="topic" 
                  v-on:click="changeToTopics(topic)"
                  v-bind:key="topic+index">
                {{topic}}
                </a>
                <a v-for="(extraTopic,index) in article.extraTopics"  
                    class="tag is-small is-light is-uppercase 
                    is-size-7 topicButton" 
                    :value="extraTopic" 
                    v-bind:key="key(index, extraTopic)"
                    v-on:click="changeToTopics(extraTopic)">
                    {{extraTopic}}
                </a>
                <add-topic :topiclist="topiclist" 
                            :articleId="article.articleId" 
                            :articleTopic="article.topics[0]" 
                            :isaddtopic="false" 
                            v-on:changeArticle="changeArticleContent"/>
              </span>
              <p class="articleContent" style="padding: 20px;">{{article.content}}</p>
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
            <button class="is-light" v-on:click="closeArticleModal">
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
        var response = await postReq('/api/getJustOneArticleByTitle', jsonObj)
        console.log(response)
        var topicsArr = response[0].topic.split("&&&")
        if(response[0].extraTopicName != null){
          var extraTopicsArr = response[0].extraTopicName.split("&&&")
        }
        await articleList.getUserTopics()
        this.article = { 
          title: response[0].title, 
          content: response[0].content, 
          topics: topicsArr,
          extraTopics: extraTopicsArr, 
          author: `${response[0].firstName} ${response[0].lastName}`,
          periodicalName: response[0].periodicalName, 
          articleId: response[0].articleId,
          authorId: response[0].authorId,
          periodicalId: response[0].periodicalId
        }
      }
    }
  })