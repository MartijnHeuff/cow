window.Cow = window.Cow || {};


function log(text){
    var textarea = d3.select('#console');
    textarea.append('span').html(text + '<br>');
}
function clearlog(){
    var textarea = d3.select('#console');
    textarea.html('');
}

Cow.testsuite = function(core){
    this.core = core;
};


Cow.testsuite.prototype.laptime = function(starttime){
    return  new Date() - starttime + 'ms ';
};

/**
    newsocket(url) - change socket connection
**/
Cow.testsuite.prototype.newsocket = function(){
};


Cow.testsuite.prototype.analyzeStore = function(){
    var core = this.core;
    var self = this;
    var starttime = new Date();
    core.projectStore().loaded.then(function(foo){
            log(self.laptime(starttime) + 'Num projects: ',core.projects().length);
            core.projects().forEach(function(d){
                d.itemStore().loaded.then(function(foo){
                    var numitems = d.items().length;
                    log(self.laptime(starttime) + 'Project ' + d.data('name') + ' (' + numitems + ' items)');
                });
                d.groupStore().loaded.then(function(foo){
                    var numitems = d.groups().length;
                    log(self.laptime(starttime) + 'Project ' + d.data('name') + ' (' + numitems + ' groups)');
                });
            });
    });
    core.userStore().loaded.then(function(foo){
        log(self.laptime(starttime) + 'Num users: ' + core.users().length);
    });
};


/**
    Create project, create 100 records, sync them, delete project 
**/
Cow.testsuite.prototype.lifecycle = function(){
    var core = this.core;
    var self = this;
    var starttime = new Date();
    
    log('Starting lifecycle test. Creating and syncing 100 items');
    core.projectStore().loaded.then(function(foo){
        var project = core.projects({_id: 'test'});
        project.data('name', 'TEST');
        project.itemStore().clear(); //remove existing items from store
        project.deleted(false).sync(); //set project undeleted
        for (var i = 0;i<100;i++){ //Add 100 records
            var item = project.items({_id: i.toString()});
            item.data('tmp',(Math.random()*100).toString());
            item.data('text','Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...');
        }
        log('changing items');
        var syncpromise = project.itemStore().syncRecords(); //sync the records
        for (i = 0;i<100;i++){//Update the records 
            item = project.items(i.toString());
            item.data('tmp',(Math.random()*100).toString());
        }
        syncpromise = project.itemStore().syncRecords(); //sync the records
        
        
        
        log('Clearing itemstore');
        project.itemStore().clear(); //remove items from store
        log('We now have ' + core.projects('test').items().length + ' items'); //should be 0 items
        project.itemStore().sync(); //full sync on itemstore
        log('Sync it back! Waiting 3 secs to sync back the 100 items');
        window.setTimeout(function(){
            log('We now have ' + core.projects('test').items().length + ' items');
            log('Clearing itemstore');
            project.itemStore().clear(); //remove items from store
            log('Sending flushing command to peers');
            core.websocket().sendData({command: 'flushProject',projectid: 'test'}, 'command');
            project.deleted(true).sync();//set project to deleted
            log(self.laptime(starttime) + ' lifecycletest finished');
        },3000);
    });
};
/**
    pingtest() - logs pingtimes to all connected peers in ms
**/

Cow.testsuite.prototype.pingtest = function(){
    var self = this;
    this.core.websocket().off('command');
    this.core.websocket().on('command', function(data){
        var payload = data.payload;
        var returntime = new Date().getTime();
        var triptime = returntime - self.starttime;
        var sender = data.sender;
        log('PONG from ' + sender + ' in ' + triptime + 'ms');
    });
    var ws = core.websocket();
    this.starttime = new Date().getTime();
    ws.sendData({command: 'ping'},'command');
};


