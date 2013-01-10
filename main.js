////////////////////////////////////////////////////////////////////////////////
// Sample - Scroll
/*
	Objectives:
		Using CObject and CImage
		Controlling CScrollControl, CBufferedScrollControl, C1WayBufferedScrollControl, C2WayBufferedScrollControl
		Using CAccelerometerDevice
		Using CMiniMap
*/
"Copyright ⓒ 2009-2012 BLUEGA Inc.";
"This sample game source is licensed under the MIT license."

////////////////////////////////////////////////////////////////////////////////
// Object manager for bxg.player

IDragonManger = {
	onActivate: function(/*Object*/obj, /*Number*/tickId)
	{
		// Initialize data
		obj.data.screenPadding = {left:30, right:30, top:30, bottom:30}; // Padding from edge of map area.
		obj.data.dx = 0;
		obj.data.dy = 0;
		obj.data.speed = bxg.game.adjustByTick(40, 8, true);
		obj.data.spriteState = 'up';
	}
	,onTick: function(/*Object*/obj, /*Number*/tickId)
	{
		if (obj.data.dx || obj.data.dy){
			obj.moveBy(obj.data.dx, obj.data.dy);
			
			if (obj.getCurSpriteState() != obj.data.spriteState){
				obj.setCurSpriteState(obj.data.spriteState);
			}
			
			// Perventing from over the map area
			if (obj.overControlScreen(null, false, obj.data.screenPadding)){
				obj.moveBy(-obj.data.dx, -obj.data.dy);
			}
		}
	}
	,onCollision: function(/*Object*/obj, /*Object*/hit)
	{
		// If hit by any bullet, after shaking screen, the game will restart.
		if (hit.type == 'bullet'){
			bxg.shake(6, bxg.game.tickInterval, 3, 'v');
			bxg.game.end();
			bxg.game.run();
		}
	}
}

////////////////////////////////////////////////////////////////////////////////
// Object manager for enemy

IEnemyManger = {
	onActivate: function(/*Object*/obj, /*Number*/tickId)
	{
		obj.data.speed = bxg.game.adjustByTick(40, 7, true);
		obj.data.state = 0;
		obj.data.tickTurn = 50;
		obj.data.startFireTick = bxg.game.tickAfter(tickId, 3000+Math.random()*3000); // Start firing after 3000+alpha msec
		
		obj.show();
	}
	,onTick: function(/*Object*/obj, /*Number*/tickId)
	{
		// Need distance and angle from cannon to player fighter.
		obj.data._dist = bxg.Geometry.getDistance(obj.center(), bxg.player.center());
		obj.data._angle = bxg.Geometry.getAngle(obj.center(), bxg.player.center());
		
		// Shot if;
		//  - Free bullet, and
		//  - Distance to bxg.player is over 200px and probability of 30%
		if (tickId > obj.data.startFireTick && obj.data._dist > 200 && Math.random() > 0.7){
			if (obj.data._bullet = bxg.g.poolBullet.searchFree()){
				obj.data._bullet.data.launcher = obj;
				obj.data._bullet.activate();
			}
		}
		
		// At start, it chases bxg.player for 0~99 ticks on same direction.
		if (obj.data.state == 0){ // Chase player
			bxg.WalkerLinear.set(obj, {speed:obj.data.speed, radian:bxg.Geometry.getDegToRad(obj.data._angle)});

			obj.data.tickTurn = parseInt(Math.random()*100);
			obj.data.state = 1;
		}
		
		// If chasing is over, then check out the bxg.player's position.(It transits to state = 0.)
		if (obj.data.state == 1){
			bxg.WalkerLinear.move(obj);
			
			obj.data.tickTurn --;
			
			if (obj.data.tickTurn < 0) obj.data.state = 0;
		}
		
		// If it overs the view screen, it will check bxg.player's position.
		if (obj.overControlScreen()){
			obj.data.state = 0;
		}
	}
}

////////////////////////////////////////////////////////////////////////////////
// Object manager for enemy bullet
// - Move by bxg.WalkerLeaner

IBulletManger = {
	onActivate: function(/*Object*/obj, /*Number*/tickId)
	{
		obj.data.speed = bxg.game.adjustByTick(40, 10, true);
		
		// Canculate angle
		// and start from the center of enemy(launcher) object.
		obj.data._angle = bxg.Geometry.getAngle(obj.data.launcher.center(), bxg.player.center(), true);
		obj.move(Math.floor(obj.data.launcher.center().x - obj.size.w/2), Math.floor(obj.data.launcher.center().y - obj.size.h/2));
	
		// Shot range is three times of distance from launcher to target(bxg.player)
		bxg.WalkerLinear.set(obj, {speed:obj.data.speed, position:{x:bxg.player.center().x+(bxg.player.center().x-obj.data.launcher.center().x)*2, y:bxg.player.center().y+(bxg.player.center().y-obj.data.launcher.center().y)*2}});
		
		obj.show();
	}
	,onTick: function(/*Object*/obj, /*Number*/tickId)
	{
		bxg.WalkerLinear.move(obj);
	}
	,onCollision: function(/*Object*/obj, /*Object*/hit)
	{
		if (hit == bxg.player){
			obj.deactivate();
		}
	}
	,onWalkerEnd: function(/*Object*/obj, /*Number*/tickId)
	{
		obj.deactivate();
	}
}

////////////////////////////////////////////////////////////////////////////////
// Control manager for scrolling

IScrollManager = {
	onInputEvent: function(/*CControl*/control, /*Object*/evtMap)
	{
		// This kinds of logic allows diagonal move
		
		bxg.player.data.dx = bxg.player.data.dy = 0;
		
		if (evtMap.keyLeft && evtMap.keyLeft.fired){
			bxg.player.data.dx = -bxg.player.data.speed; //W(L)
			bxg.player.data.spriteState = 'left';
		}
		else if (evtMap.keyRight && evtMap.keyRight.fired){
			bxg.player.data.dx = bxg.player.data.speed; //E(R)
			bxg.player.data.spriteState = 'right';
		}
		
		if (evtMap.keyUp && evtMap.keyUp.fired){
			bxg.player.data.dy = -bxg.player.data.speed; //N(U)
			bxg.player.data.spriteState = 'up';
		}
		else if (evtMap.keyDown && evtMap.keyDown.fired){
			bxg.player.data.dy = bxg.player.data.speed; //S(D)
			bxg.player.data.spriteState = 'down';
		}
	}
	,onTick: function(/*CControl*/control, /*Number*/tickId)
	{	
		// Check the moving direction of bxg.player
		if (bxg.player.position().x - control.data._playerPrePos.x < 0){
			control.data._playerDir.x = 1; // LEFT;
		}
		else if (bxg.player.position().x - control.data._playerPrePos.x > 0){
			control.data._playerDir.x = 2; // RIGHT;
		}
		else{
			control.data._playerDir.x = 0; // NONE
		}
		
		if (bxg.player.position().y - control.data._playerPrePos.y < 0){
			control.data._playerDir.y = 1; // UP;
		}
		else if (bxg.player.position().y - control.data._playerPrePos.y > 0){
			control.data._playerDir.y = 2; // DOWN;
		}
		else{
			control.data._playerDir.y = 0; // NONE
		}
		
		// Scroll control area by moving of bxg.player
		//  - If bxg.player get to the edge of view screen and the moving direciton is same, then it will scroll.
		bxg.player.overViewScreen(control.data._checkScreen, false, {left:bxg.player.size.w, right:bxg.player.size.w, top:bxg.player.size.h, bottom:bxg.player.size.h});
	
		if (control.data._checkScreen.x && control.data._checkScreen.x == control.data._playerDir.x){
			control.data._scroll.x = -(bxg.player.position().x - control.data._playerPrePos.x);
		}
		
		if (control.data._checkScreen.y && control.data._checkScreen.y == control.data._playerDir.y){
			control.data._scroll.y = -(bxg.player.position().y - control.data._playerPrePos.y);
		}
		
		if (control.data._scroll.x || control.data._scroll.y){
			control.scroll(control.data._scroll.x, control.data._scroll.y);

			control.data._scroll.x = 0;
			control.data._scroll.y = 0;
		}
		
		// Store bxg.player's previous position to check the moving direction when it needs to scroll the view screen.
		control.data._playerPrePos.x = bxg.player.position().x;
		control.data._playerPrePos.y = bxg.player.position().y;
		
		// Refresh Mini-map per 5 ticks
		if (tickId%5 == 0){
			bxg.g.miniMap.render();
		}
	}
	,onReset: function(/*CControl*/control)
	{
		// Setup enemies, place them at random position in the control area.
		var obj;
		
		for(var i = 0; i < control.data.objEnemies.length; i ++){
			obj = control.data.objEnemies[i];
			
			obj.deactivate();
			obj.activate();
			obj.move(parseInt(Math.random()*(control.scrollSize.w-obj.size.w)), parseInt(Math.random() * control.scrollSize.h));
			obj.show();
		}

		// Scroll map to center position of view
		control.scroll(-parseInt((control.scrollSize.w - control.area.w)/2), -parseInt((control.scrollSize.h - control.area.h)/2));
		
		// Activate player and start it from center position
		bxg.player.activate();
		bxg.player.move(parseInt((control.scrollSize.w - bxg.player.size.w)/2), parseInt((control.scrollSize.h - bxg.player.size.h)/2));
		bxg.player.show();
		
		// Init internal data
		control.data._checkScreen = control.data._checkScreen || {};
		control.data._playerPrePos = {x:bxg.player.position().x, y:bxg.player.position().y};
		control.data._playerDir = {x:0, y:0};
		control.data._scroll = {x:0, y:0};
	}
}

////////////////////////////////////////////////////////////////////////////////
// Game core

bxg.onGame = function()
{
	// Configurations
	//  - get 'type' by URL parameter
	//	- get count of objects by URL parameter
	bxg.c.type = bx.$getParamFromURL(location.href, 'type') || '4';
	bxg.c.countObjs = parseInt(bx.$getParamFromURL(location.href, 'OB')) || 100;
	bxg.c.tick = 33; 		//msec
	bxg.c.countEnemy = parseInt(bxg.c.countObjs*0.6);
	bxg.c.countBullet = parseInt(bxg.c.countObjs*0.4);		// Shot by enemy
	bxg.c.countBush = 100;
	bxg.c.scrSize = {w:480, h:600};
	
	// Initialize BXG engine, aligning in page center
	bxg.init({x:0, y:0, w:bxg.c.scrSize.w, h:bxg.c.scrSize.h}, {renderer:'canvas', align:{x:'center', y:'center'}});
	
	// Turn on waiting-box for game loading
	bx.UX.waitBox(true, "Loading...");
	
	// Load image resouce for non-ObjectFactory-created Objects and Image objects (and HTML)
	// This is asynchronous function
	bxg.imageLoader.load(
		{
			dragonU:{url:'imgs/dragon/$$_1.png', count:4, start:1, zero:1}
			,dragonD:{url:'imgs/dragon/$$_3.png', count:4, start:1, zero:1}
			,dragonR:{url:'imgs/dragon/$$_2.png', count:4, start:1, zero:1}
			,dragonL:{url:'imgs/dragon/$$_4.png', count:4, start:1, zero:1}
			,enemy:{url:'imgs/ufo.png', sprite:{size:{w:80, h:80}, cols:3, count:3}}
			,bullet:{url:'imgs/red_ball_16.png'}
			,bush:{url:'imgs/bg/desert/trees.png'}
			,crack:{url:'imgs/bg/desert/crack.png'}
			,background:{url:'imgs/bg/desert/bg.jpg'}
		},
		onReady
	);
}

/*
	zIndex band
		0 ~ : baselayer
			0: Background pattern
			1: Bush image
		10 ~
			10: Enemy object
			11: Bullet object
		20 ~
			20: Player object
*/
function onReady(/*Number*/loaded, /*Number*/failed)
{
	// Setup scrollable game control by give type.
	switch(bxg.c.type){
	case '4B': // 4Way buffered scroll, so large map area.
		bxg.c.mapSize = {w:bxg.c.scrSize.w*8, h:bxg.c.scrSize.h*8};
		bxg.c.miniMapSize = bxg.c.scrSize.w/4;
		bxg.g.control1 = new bxg.CBufferedScrollControl(IScrollManager, {size:bxg.c.mapSize}).create();
		break;
	case '2Bh': // 2Way buffered scroll - Horizontal
		bxg.c.mapSize = {w:bxg.c.scrSize.w*8, h:bxg.c.scrSize.h};
		bxg.c.miniMapSize = bxg.c.scrSize.w/2;
		bxg.g.control1 = new bxg.C2WayBufferedScrollControl(IScrollManager, {size:bxg.c.mapSize, dir:'horizontal'}).create();
		break;
	case '2Bv': // 2Way buffered scroll - Vertical
		bxg.c.mapSize = {w:bxg.c.scrSize.w, h:bxg.c.scrSize.h*8};
		bxg.c.miniMapSize = bxg.c.scrSize.w/12;
		bxg.g.control1 = new bxg.C2WayBufferedScrollControl(IScrollManager, {size:bxg.c.mapSize, dir:'vertical'}).create();
		break;
	default: // 4Way scroll, non-buffered scroll, so 4x size of map area.
		bxg.c.mapSize = {w:bxg.c.scrSize.w*2, h:bxg.c.scrSize.h*2};
		bxg.c.miniMapSize = bxg.c.scrSize.w/4;
		bxg.g.control1 = new bxg.CScrollControl(IScrollManager, {size:bxg.c.mapSize}).create();
		break;
	}
	
	// Create and add player object, not by Object-factory
	bxg.player = bxg.g.control1.add(
		new bxg.CObject(
			'player'
			,{
				up:{sprite:['dragonU1', 'dragonU2', 'dragonU3', 'dragonU4', 'dragonU2']}
				,down:{sprite:['dragonD1', 'dragonD2', 'dragonD3', 'dragonD4', 'dragonD2']}
				,left:{sprite:['dragonL1', 'dragonL2', 'dragonL3', 'dragonL4', 'dragonL2'], cdShape:[{rect:{x:10, y:25, w:60, h:30}}]}
				,right:{sprite:['dragonR1', 'dragonR2', 'dragonR3', 'dragonR4', 'dragonR2'], cdShape:[{rect:{x:10, y:25, w:60, h:30}}]}
			}
			,{
				manager:IDragonManger
				,cdShape:[{rect:{x:25, y:10, w:30, h:60}}] // 81x81
				,zIndex:20
			}
		).create()
	);
	
	var i;
	var obj;
	
	// Create Enemy objects and add to game control, not by Object-factory
	bxg.g.control1.data.objEnemies = [];
	
	for(i = 0; i < bxg.c.countEnemy; i ++){
		obj = new bxg.CObject(
			'enemy'
			,{
				fly:{sprite:['enemy1', 'enemy2', 'enemy3']}
			}
			,{
				manager:IEnemyManger
				,zIndex:10
			}
		).create();
			
		bxg.g.control1.add(obj);
		bxg.g.control1.data.objEnemies.push(obj);
	}
	
	// Create Enemy's shot and put into CObjectPool, not by Object-factory
	bxg.g.poolBullet = new bxg.CObjectPool();
	
	for(i = 0; i < bxg.c.countBullet; i ++){
		bxg.g.poolBullet.add(
			new bxg.CObject(
				'bullet'
				,{
					normal:{sprite:['bullet']}
				}
				,{
					manager:IBulletManger
					,cdShape:[{circle:{x:7, y:7, r:7}}]
					,zIndex:11
				}			
			).create()
		);
	}

	bxg.g.poolBullet.addToControl(bxg.g.control1);

	// Create and add background pattern and images (crack and bush image)
	bxg.g.control1.add(new bxg.CImage('background', {baseLayer:true, zIndex:0, pattern:true})).move(0, 0);
	bxg.g.control1.add(new bxg.CImage('crack', {baseLayer:true, zIndex:1})).move(50, 50);
	
	for(var tile = 0; tile < bxg.c.countBush; tile ++){
		bxg.g.control1.add(new bxg.CImage('bush', {baseLayer:true, zIndex:2})).move(bxg.g.control1.scrollSize.w*Math.random(), bxg.g.control1.scrollSize.h*Math.random());
	}
	
	// Add input device
	//   CAccelerometerDevice for touch device
	//   CKeyDevice for PC
	if (bx.HCL.DV.hasTouchEvent()){
		bxg.game.addInputDevice(new bxg.CAccelerometerDevice({
				keyLeft:{x:{max:-1, min:-10}, type:'event'},
				keyRight:{x:{max:10, min:1}, type:'event'},
				keyUp:{y:{max:-1, min:-10}, type:'event'},
				keyDown:{y:{max:10, min:1}, type:'event'}
			}
			,{multi:true}
		));
	}
	else{
		bxg.game.addInputDevice(new bxg.CKeyDevice(
			{
				keyUp:{key:'keyUp', type:'polling'}
				,keyDown:{key:'keyDown', type:'polling'}
				,keyLeft:{key:'keyLeft', type:'polling'}
				,keyRight:{key:'keyRight', type:'polling'} 
			}
			,{multi:true}
		));
	}
	
	// Turn off waiting-box
	bx.UX.waitBox(false);
	
	// Create CMiniMap to display the preview of map and view area
	bxg.g.miniMap = new bxg.CMiniMap(
		{
			control:bxg.g.control1
			,width: bxg.c.miniMapSize
			,map:{fillStyle:'#000000', opacity:0.3}
			,view:{fillStyle:'#ffffff', opacity:0.2}
			,objects:{ // Types of object which are tracked by this map.
				enemy:{shape:'circle', borderStyle:'#000000'}
				,player:{borderStyle:'#770000'} // Default shape='rect'
			}
		}
	).create();
	
	// If 'tag', it means that it is successfully created.
	// And, then it can be handeled by DOM and CSS.
	if (bxg.g.miniMap.tag){
		bxg.g.miniMap.show();
		
		bxg.playGround.appendChild(bxg.g.miniMap.tag);
		bxg.g.miniMap.tag.style.border = 'solid 1px #555522';
		bxg.g.miniMap.tag.style.right = '10px';
		bxg.g.miniMap.tag.style.top = '10px';
		bxg.g.miniMap.tag.style.zIndex = bxg.getZindexTop(1);
	}
	
	// Game start
	bxg.game.init({tick:bxg.c.tick});
	bxg.game.addControl(bxg.g.control1);
	bxg.game.run();
	
	bxg.Inspector.createConsole({consolePerformanceFull:true});
}
