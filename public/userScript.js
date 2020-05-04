
function makeUserArticleHistory(response){
    var ul = document.createElement("ul");
    console.log('asdf', response.length)
    for(var i=0; i < response.length; i++){

        let title = document.createElement("span");
        title.innerText = response[i].title;
        title.className = "subtitle";

        let content = document.createElement("span");
        content.innerText = response[i].content.substr(0,100) + " ... ";
        content.className = "content";

        let link = document.createElement("a");
        link.innerHTML = 'Read Again <i class="fas fa-share"></i>';
        link.href = response[i].url;
        link.target = '_blank';

        let lastViewed = document.createElement("span");
        let date = new Date(response[i].lastViewed)

        let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)
        let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
        let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date)

        lastViewed.innerText = `Read: ${month} ${day} ${year} `;
        lastViewed.className = "last-viewed";

        let li =  document.createElement("li");
        li.appendChild(title);
        li.appendChild(content);
        li.appendChild(lastViewed);
        li.appendChild(link);

        ul.appendChild(li);
    }
    var userArticleHistoryList = document.querySelector('#userArticleHistoryList');
    userArticleHistoryList.appendChild(ul);
    // getUserTopics(checkboxes);
}

function getUserArticlesHistory(){
    var req = new XMLHttpRequest();
    req.open("GET", "/api/getUserArticlesHistory");
    req.addEventListener('load', function(){
        if(req.status >= 200 && req.status < 400){
            var response = JSON.parse(req.responseText);
            console.log('wat', response);

            if(response.length > 0){
                makeUserArticleHistory(response);
                // getTopicArticles(response);
            }
            else{
                // displayNoArticles();
            }
        }
        else{
            console.log("Error! " + req.statusText);
        }
    })
    req.send();
}


getUserArticlesHistory();
