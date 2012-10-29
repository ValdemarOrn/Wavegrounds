using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Wavegrounds.Controllers
{
	public class SketchController : Controller
	{
		public ActionResult Index()
		{
			string path = Server.MapPath("~/Wavegrounds.html");
			string content = System.IO.File.ReadAllText(path);
			return Content(content);
		}

		[HttpPost]
		public ActionResult Save(Sketch sketch)
		{
			try
			{
				if (String.IsNullOrEmpty(sketch.Config) || String.IsNullOrEmpty(sketch.Settings) || String.IsNullOrEmpty(sketch.Version))
					return Json(new { Status = "Failed", Message = "Required Fields are missing. Required Fields are config, Settings, Version and Public" });

				if (sketch.Config.Length > 8000 || sketch.Settings.Length > 2000 || sketch.Version.Length > 20)
					return Json(new { Status = "Failed", Message = "Too much data" });

				var ctx = new Context();
				var maxID = 0;
				if (ctx.Sketches.Count() > 0)
					maxID = (int)ctx.Sketches.Max(x => x.Id);

				for (int i = 0; i < 10; i++)
				{
					string reference = MakeReference(maxID);

					// check if already exists
					if (ctx.Sketches.Any(x => x.Ref == reference))
						continue;

					sketch.Timestamp = DateTime.Now;
					sketch.Ref = reference;
					ctx.Sketches.Add(sketch);
					ctx.SaveChanges();

					return Json(new { Status = "OK", Ref = reference });
				}

				return Json(new { Status = "Failed", Message = "Failed to generate reference key" });
			}
			catch (Exception e)
			{
				string msg = e.Message;
				if(e.InnerException != null)
					msg += " - " + e.InnerException.Message;

				return Json(new { Status = "Failed", Message = msg });
			}
		}

		[HttpGet]
		public ActionResult Load(string id)
		{
			var ctx = new Context();
			var sketch = ctx.Sketches.FirstOrDefault(x => x.Ref == id);

			if(sketch == null)
				return Json(new { Status = "Failed" });

			return Json(new { Status = "OK", Config = sketch.Config, Settings = sketch.Settings, Version = sketch.Version }, JsonRequestBehavior.AllowGet);
		}

		private string MakeReference(int maxID)
		{
			if(maxID < 1000)
				maxID = 1000;

			var cnt = (int)Math.Ceiling(Math.Log10(maxID));

			var rand = new Random((int)DateTime.Now.Ticks);
			var arr = new char[cnt * 2];
			for(int i = 0; i < arr.Length; i++)
			{
				int x = rand.Next(97, 133);
				if (x <= 122)
					arr[i] = (char)x;
				else
					arr[i] = (char)(x - 75);
			}

			string s = new string(arr);
			return s;
		}

	}
}
