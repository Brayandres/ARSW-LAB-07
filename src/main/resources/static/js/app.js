var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;
    var _drawID = "";

    var addPointToCanvas = function (point) {
        console.log("POINT: "+point);
        console.log("  x: "+point.x);
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.stroke();
    };

    var drawPolygon = function(points) {
        console.log(" -- In Draw Polygon --");
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#00FFAA";
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[0].x, points[0].y);
        ctx.stroke();
        ctx.closePath();
        ctx.fill();
    };
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/newpoint when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            // Points
            stompClient.subscribe('/topic/newpoint.'+_drawID, function(eventbody) {
                console.log("  ---- After Send ----");
                var theObject = JSON.parse(eventbody.body);
                addPointToCanvas(theObject);
                //alert("EV: "+eventbody.body);
            });
            // Polygons
            stompClient.subscribe("/topic/newpolygon."+_drawID, function(eventbody) {
                console.log("  ---- A NEW POLYGON HAS ARRIVED ----");
                var points = JSON.parse(eventbody.body);
                console.log("  First Point: ("+points[0].x+", "+points[0].y+")");
                drawPolygon(points);
            });
        });
    };

    var publishPoint = function(px, py) {
        var pt = new Point(px,py);
        console.info("publishing point at "+pt);
        stompClient.send("/app/newpoint."+_drawID, {}, JSON.stringify(pt));
    };

    var _initDrawPointEvent = function() {
        var canvas = document.getElementById("canvas");
        if (window.PointerEvent) {
            canvas.addEventListener(
                "pointerdown",
                function(event){
                    let pos = getMousePosition(event);
                    publishPoint(pos.x, pos.y);
                },
                false
            );
        }
        else {
            canvas.addEventListener(
                "mousedown",
                function(event){
                    let pos = getMousePosition(event);
                    publishPoint(pos.x, pos.y);
                },
                false
            );
        }
    };
    

    return {
        init: function (drawID) {
            _drawID = drawID;
            _initDrawPointEvent();
            //websocket connection
            connectAndSubscribe();
        },

        publishPoint: publishPoint,

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();