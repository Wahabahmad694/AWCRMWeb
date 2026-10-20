"use client";

import { useState } from "react";

type Row = { key: number; id: string; quantity: string; unitPrice: string };
export function LineEditor({ operationId }: { operationId: string }) {
  const [rows, setRows] = useState<Row[]>([{ key:0,id:"",quantity:"",unitPrice:"" }]);
  const idKey = operationId === "order.return" ? "order_item_id" : "product_id";
  const quantityKey = operationId === "inventory.adjust" ? "quantity_change" : operationId === "inventory.stocktake" ? "counted_quantity" : "quantity";
  const serialized = JSON.stringify(rows.filter(row => row.id || row.quantity).map(row => ({ [idKey]:row.id.trim(), [quantityKey]:row.quantity.trim(), ...(operationId === "order.create" && row.unitPrice ? { unit_price_paisa:Math.round(Number(row.unitPrice) * 100) } : {}) })));
  const update = (key:number, field:keyof Row, value:string) => setRows(current => current.map(row => row.key === key ? {...row,[field]:value} : row));
  return <div className="line-editor"><input type="hidden" name="lines" value={serialized} />{rows.map(row => <div className="line-row" key={row.key}><label><span>{idKey.replaceAll("_"," ")}</span><input value={row.id} onChange={event => update(row.key,"id",event.target.value)} placeholder="UUID" /></label><label><span>{quantityKey.replaceAll("_"," ")}</span><input value={row.quantity} onChange={event => update(row.key,"quantity",event.target.value)} inputMode="decimal" placeholder={quantityKey === "quantity_change" ? "2 or -2" : "1"} /></label>{operationId === "order.create" && <label><span>Unit price override (PKR)</span><input value={row.unitPrice} onChange={event => update(row.key,"unitPrice",event.target.value)} inputMode="decimal" placeholder="Optional" /></label>}<button type="button" className="line-remove" onClick={() => setRows(current => current.length > 1 ? current.filter(item => item.key !== row.key) : current)} aria-label="Remove line">×</button></div>)}<button type="button" className="line-add" onClick={() => setRows(current => [...current,{key:Math.max(...current.map(row => row.key))+1,id:"",quantity:"",unitPrice:""}])}>Add line</button></div>;
}
