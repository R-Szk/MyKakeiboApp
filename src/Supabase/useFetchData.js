import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

/**
 * 指定されたテーブルのデータを取得するカスタムフック
 * @param {string} table - テーブル名
 * @param {string} columns - 取得するカラム名（デフォルトは*）
 * @param {Array} filters - フィルター条件 [{ column, value, operator }]
 * @returns {Object} { data, loading, error } - 取得したデータ
 */
export const useFetchData = (table, columns = "*", filters = [], limit = null, orderBy = null) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            let query = supabase.from(table).select(columns);
            // setLoading(true);

            // フィルタの適用
            filters.forEach(filter => {
                query = query[filter.operator || 'eq'](filter.column, filter.value);
            });

            // 並び順の適用
            // if (orderBy && orderBy.column) {
            if (orderBy !== null) {
                query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
            }

            // limitの適用
            if (limit !== null) {
                query = query.limit(limit);
            }

            const { data, error } = await query;

            if (error) {
                setError(error);
            } else {
                setData(data);
            }
            setLoading(false);
        };

        fetchData();
    }, [table, columns, JSON.stringify(filters), limit, JSON.stringify(orderBy)]);

    return { data, loading, error };
};

export default useFetchData;