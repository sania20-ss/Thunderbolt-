import React, { useState } from 'react';
import { Database, Play, Copy, Check, Terminal, Table as TableIcon, Layers, Server, RefreshCw, AlertCircle } from 'lucide-react';
import { dbService } from '../services/db';

export const MysqlStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'console' | 'schema' | 'ddl'>('console');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM users;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [copiedDdl, setCopiedDdl] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<string>('users');

  const tables = dbService.getTableDefinitions();

  const handleExecute = (overrideQuery?: string) => {
    const q = overrideQuery || sqlQuery;
    setIsExecuting(true);
    setTimeout(() => {
      const res = dbService.executeSql(q);
      setQueryResult(res);
      setIsExecuting(false);
    }, 150);
  };

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(dbService.getRawMysqlSchemaSql());
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2500);
  };

  const currentTable = tables.find(t => t.name === selectedTable) || tables[0];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* MySQL Connection Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">MySQL Database Connection</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  CONNECTED
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                <span>jdbc:mysql://localhost:3306/auth_db</span>
                <span className="mx-2 text-slate-600">|</span>
                <span>Driver: com.mysql.cj.jdbc.Driver</span>
              </div>
            </div>
          </div>

          {/* Connection Pool Telemetry */}
          <div className="flex items-center gap-4 text-xs font-mono bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">HIKARICP POOL</span>
              <span className="text-sky-400 font-semibold">auth_db_pool</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">ACTIVE CONNS</span>
              <span className="text-emerald-400 font-semibold">3 / 10</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">AVG LATENCY</span>
              <span className="text-slate-300 font-semibold">2.4ms</span>
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'console'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Interactive SQL Console</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'schema'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Schema &amp; Table Inspector</span>
          </button>
          <button
            onClick={() => setActiveTab('ddl')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'ddl'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Raw MySQL DDL Script</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Interactive SQL Console */}
      {activeTab === 'console' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>Execute SQL Query against MySQL</span>
              </h3>
              <p className="text-xs text-slate-400">
                Run queries directly on the live database storing registered users and OTPs.
              </p>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setSqlQuery('SELECT * FROM users;');
                  handleExecute('SELECT * FROM users;');
                }}
                className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 transition-colors"
              >
                users
              </button>
              <button
                type="button"
                onClick={() => {
                  setSqlQuery('SELECT * FROM email_otps;');
                  handleExecute('SELECT * FROM email_otps;');
                }}
                className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 transition-colors"
              >
                email_otps
              </button>
              <button
                type="button"
                onClick={() => {
                  setSqlQuery('SELECT * FROM security_audit_logs;');
                  handleExecute('SELECT * FROM security_audit_logs;');
                }}
                className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 transition-colors"
              >
                audit_logs
              </button>
              <button
                type="button"
                onClick={() => {
                  setSqlQuery('DESCRIBE users;');
                  handleExecute('DESCRIBE users;');
                }}
                className="px-2 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 transition-colors"
              >
                DESC users
              </button>
            </div>
          </div>

          {/* SQL Editor Area */}
          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
            <textarea
              rows={3}
              value={sqlQuery}
              onChange={e => setSqlQuery(e.target.value)}
              className="w-full p-4 font-mono text-xs sm:text-sm text-sky-200 bg-slate-950 focus:outline-none resize-y selection:bg-sky-500/30"
              placeholder="Enter MySQL query (e.g., SELECT * FROM users;)"
            />
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-t border-slate-800 text-xs">
              <span className="text-slate-500 font-mono text-[11px]">Database: auth_db | Dialect: MySQL 8.0</span>
              <button
                type="button"
                onClick={() => handleExecute()}
                disabled={isExecuting}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Execute (Run)</span>
              </button>
            </div>
          </div>

          {/* Results Grid */}
          {queryResult && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className={queryResult.success ? 'text-emerald-400' : 'text-rose-400'}>
                    {queryResult.success ? '✓ Query executed successfully' : '✗ Query error'}
                  </span>
                  <span>•</span>
                  <span>Latency: {queryResult.latencyMs}ms</span>
                  {queryResult.rows && (
                    <>
                      <span>•</span>
                      <span>{queryResult.rows.length} rows returned</span>
                    </>
                  )}
                </div>
              </div>

              {!queryResult.success ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{queryResult.message}</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-96">
                  <table className="w-full text-left text-xs text-slate-300 font-mono">
                    <thead className="bg-slate-950 text-sky-400 uppercase text-[11px] border-b border-slate-800 sticky top-0">
                      <tr>
                        {queryResult.columns.map((col: string, idx: number) => (
                          <th key={idx} className="px-3.5 py-2.5 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {queryResult.rows.map((row: any[], rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-800/40">
                          {row.map((cell: any, cIdx: number) => (
                            <td key={cIdx} className="px-3.5 py-2 whitespace-nowrap text-slate-300">
                              {cell === null ? (
                                <span className="text-slate-600 italic">NULL</span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Schema & Table Inspector */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Table selector sidebar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tables in auth_db</h4>
            {tables.map(tbl => (
              <button
                key={tbl.name}
                onClick={() => setSelectedTable(tbl.name)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-colors flex items-center justify-between ${
                  selectedTable === tbl.name
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>{tbl.name}</span>
                </div>
                <span className="text-[10px] opacity-75 font-sans">({tbl.rowCount} rows)</span>
              </button>
            ))}
          </div>

          {/* Table Details */}
          <div className="md:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">{currentTable.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  Engine: InnoDB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{currentTable.description}</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-3.5 py-2.5">Field</th>
                    <th className="px-3.5 py-2.5">Type</th>
                    <th className="px-3.5 py-2.5">Null</th>
                    <th className="px-3.5 py-2.5">Key</th>
                    <th className="px-3.5 py-2.5">Default</th>
                    <th className="px-3.5 py-2.5">Extra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {currentTable.columns.map((col, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="px-3.5 py-2.5 text-white font-semibold">{col.field}</td>
                      <td className="px-3.5 py-2.5 text-sky-300">{col.type}</td>
                      <td className="px-3.5 py-2.5 text-slate-400">{col.null}</td>
                      <td className="px-3.5 py-2.5">
                        {col.key === 'PRI' ? (
                          <span className="text-amber-400 font-bold">PRIMARY KEY</span>
                        ) : col.key === 'UNI' ? (
                          <span className="text-indigo-400">UNIQUE</span>
                        ) : col.key === 'MUL' ? (
                          <span className="text-emerald-400">INDEX</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-400">{col.default ?? 'NULL'}</td>
                      <td className="px-3.5 py-2.5 text-slate-500">{col.extra || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Raw MySQL DDL Script */}
      {activeTab === 'ddl' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-sky-400" />
                <span>Production MySQL DDL Schema Script (schema.sql)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ready to execute directly in MySQL CLI, Workbench, Amazon RDS, or Docker container.
              </p>
            </div>
            <button
              onClick={handleCopyDdl}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copiedDdl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDdl ? 'Copied to Clipboard' : 'Copy SQL Script'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-[500px]">
            {dbService.getRawMysqlSchemaSql()}
          </pre>
        </div>
      )}
    </div>
  );
};
