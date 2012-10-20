/// <reference path="jquery-1.7.1.intellisense.js"/>
/// <reference path="jquery-1.7.1.js" />
/// <reference path="Pendulum.js" />
/// <reference path="PendulumController.js" />
/// <reference path="jquery.mousewheel.min.js" />

$(document).ready(function ()
{
	// Twitter Script
//	!function (d, s, id) { var js, fjs = d.getElementsByTagName(s)[0]; if (!d.getElementById(id)) { js = d.createElement(s); js.id = id; js.src = "//platform.twitter.com/widgets.js"; fjs.parentNode.insertBefore(js, fjs); } }(document, "script", "twitter-wjs");

	var Ctrl = M.Controller;

	var isStarted = Ctrl.StartApplication();
	if (!isStarted)
		return;

	var lastMousePos = null;

	// event that occurs when tweaking the sliders
	function UpdateMouseControl(id, dx, dy)
	{
		if (id === 'Canvas')
		{
			Ctrl.PanCanvas(dx, dy);
			return;
		}

		var val = Number($('#' + id).val());
		var info = M.ConfigInfo[id];

		if(info.type === 'exp' || info.type == 'explimit')
		{
			var d = (info.type === 'exp') ? -dy : dx;
			
			if (d == 0)
				return;

			var minChange = Math.pow(10, -info.precision);

			var dVal = val * (info.scale * d);
			if(Math.abs(dVal) < minChange)
				dVal = (d > 0) ? minChange : -minChange;
			
			val = val + dVal;
		}
		else if (info.type === 'lin')
		{
			if (dy == 0)
				return;

			val = val - info.scale * dy;
		}
		else if (info.type === 'limit')
		{
			if (dx == 0)
				return;

			val = val + info.scale * dx;
		}

		Ctrl.SetValue(id, val, true);
	}


	// ----------------------------Control events ----------------------------

	$(window).mouseup(function ()
	{
		console.log('mouse up, active was ' + Ctrl.ActiveController);
		Ctrl.ActiveController = null;
		$('#Control input').css('-moz-user-select', 'text');
		$('#Control input').css('-webkit-user-select', 'text');
	});

	$(window).mousemove(function (event)
	{
		if (lastMousePos == null || Ctrl.ActiveController == null)
		{
			lastMousePos = [event.pageX, event.pageY];
			return;
		}

		var dx = event.pageX - lastMousePos[0];
		var dy = event.pageY - lastMousePos[1];

		lastMousePos = [event.pageX, event.pageY];
		console.log('move: ' + lastMousePos[0] + ', ' + lastMousePos[1]);

		UpdateMouseControl(Ctrl.ActiveController, dx, dy);
	});

	$(window).resize(function ()
	{
		$("#Control").mCustomScrollbar("update");
	});

	// Show/Hide the clicked settings block
	$('#Control .Settings').click(function ()
	{
		var id = $(this).prop('id');
		Ctrl.EventToggleSettings(id);
	});

	$('.Controller').each(function ()
	{
		$(this).prop('unselectable', 'on');
		var id = $(this).prop('id');

		Ctrl.AddController(this);
	});

	// Pan Canvas
	$('#Canvas').mousedown(function ()
	{
		Ctrl.ActiveController = 'Canvas';
		$('#Control input').css('-moz-user-select', '-moz-none');
		$('#Control input').css('-webkit-user-select', 'none');
	});

	$('#Canvas').mousewheel(function (event, delta, deltaX, deltaY)
	{
		Ctrl.Zoom(delta);
	});

	// Read canvas ingo png image and show image dialog
	$('#GetImage').click(function ()
	{
		Ctrl.EventGetImage();
	});

	// Open Save & Share dialog
	$('#SaveShare').click(function ()
	{
		Ctrl.EventSaveShare();
	});

	// Save button on Share dialog
	$('#SaveImage').click(function ()
	{
		Ctrl.PostSketch();
	});

	// Open Instructions dialog
	$('#Instructions').click(function ()
	{
		Ctrl.EventInstructions();
	});

	// Open About dialog
	$('#About').click(function ()
	{
		Ctrl.EventAbout();
	});

	(function SetScrollbar()
	{
		// Assign a custom scrollbar to the settings window
		$("#Control").mCustomScrollbar({
			advanced: {
				updateOnBrowserResize: true,
				updateOnContentResize: true,
				autoExpandHorizontalScroll: true
			}
		});
	})();

	$('#ControlMinimize').click(function ()
	{
		if ($('#ControlMinimize').html() == '˄')
		{
			$('#ControlContainer').animate({ 'height': '0px', 'width': '120px' }, 200);
			$('#ControlMinimize').html('˅');
		}
		else
		{
			var callback = function () { $("#Control").mCustomScrollbar("update"); };
			$('#ControlContainer').animate({ 'height': '80%', 'width': '430px' }, 200, 'linear', callback);
			$('#ControlMinimize').html('˄');
		}
	});

	Ctrl.SetDefaults();
	
});

