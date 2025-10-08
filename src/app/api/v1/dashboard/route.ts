import { NextRequest, NextResponse } from "next/server";
import { config } from "@/db/dbconfig";
const sql = require("mssql");

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const pool = await sql.connect(config);

    const [result1, result3, result4, result5, result6] =
      await Promise.all([
        pool.request().query("SELECT * FROM dashboard"),
        pool
          .request()
          .query("SELECT takeoff1kw, takeoff2kw, takeoff3kw FROM powerhouse1"),
        pool
          .request()
          .query(
            "SELECT Takeoff4kw, Takeoff5kw, Takeoff6kw, Takeoff7kw, Takeoff8kw, AUX_LV_Takeoff FROM powerhouse2"
          ),
        pool
          .request()
          .query(
            "SELECT Takeoff1kw, Takeoff2kw, Takeoff3kw, Takeoff4kw FROM powerhouse3"
          ),
        pool
          .request()
          .query(
            "SELECT AUXILIARY_kw, TOWARDS_PH1_kw, AM17_B_kw FROM AM17_PH2"
          ),
      ]);

    // Combine results
    const combinedResults = {
      dashboard: result1.recordset,
      ph1_takeoffs: result3.recordset,
      ph2_takeoffs: result4.recordset,
      ph3_takeoffs: result5.recordset,
      am17_takeoffs: result6.recordset,
    };

    return NextResponse.json({ data: combinedResults });
  } catch (error) {
    console.error("Error querying data:", error);
    return NextResponse.json({ error: "Error querying data" }, { status: 500 });
  }
};
