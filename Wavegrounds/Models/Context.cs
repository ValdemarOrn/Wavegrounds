using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace Wavegrounds
{
	public class Context : DbContext
	{
		public static string ConnString;

		static Context()
		{
			ConnString = "data source=" + HttpContext.Current.Server.MapPath("~") + "\\Content\\test.db";
		}

		public Context() : base(@"SqliteConn")
		{
			this.Database.Connection.ConnectionString = ConnString;
			Database.SetInitializer<Context>(null);
		}

		public DbSet<Sketch> Sketches { get; set; }
	}

	public class Sketch
	{
		public Int64 Id { get; set; }

		public string Ref { get; set; }
		public string Config { get; set; }
		public string Settings { get; set; }
		public string Version { get; set; }
		public bool Public { get; set; }
		public DateTime Timestamp { get; set; }
	}
}