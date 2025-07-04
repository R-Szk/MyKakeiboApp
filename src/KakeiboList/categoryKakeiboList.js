import Header from "../Header";

import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useContext } from "react";

import { format, startOfMonth, endOfMonth } from "date-fns";

// import { ArcElement, Legend, Tooltip, Chart as chartJs } from "chart.js";
import { Chart as chartJs, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar, Chart } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { supabase } from "../Supabase/supabaseClient";
import useFetchData from "../Supabase/useFetchData";

chartJs.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
);

function CategoryKakeiboList() {
    const location = useLocation();
    const navigate = useNavigate();

    const { categoryId, displayDay } = location.state || {}; // カテゴリIDと表示日付を取得

    const [monthlyExpensesList, setMonthlyExpensesList] = useState([]);

    // 指定したカテゴリ、かつ指定した期間に合致する支出・収入リストを取得する
    const fetchItem = useFetchData(
        'income_outgo_items',
        '*, outgo_categories(outgo_category_name)',
        [
            // 支出・収入のカテゴリを指定
            { column: 'outgo_category_id', value: categoryId, operator: 'eq' },
            { column: 'is_outgo', value: true, operator: 'eq' }, // 支出を指定
            // 表示する月を指定
            { column: 'transaction_date', value: format(startOfMonth(new Date(displayDay)), 'yyyy-MM-dd'), operator: 'gte' },
            { column: 'transaction_date', value: format(endOfMonth(new Date(displayDay)), 'yyyy-MM-dd'), operator: 'lte' }
        ]
    );

    // 指定したカテゴリの月単位の支出・収入リストを取得する
    useEffect(() => {
        const fetchItem = async () => {
            const { data, error } = await supabase.rpc('monthlyexpenseslist', {
                category_id: categoryId
            });

            if (error) {
                console.error('Error fetching item:', error);
            }
            else if (data) {
                // console.log('Fetched item:', data);
                setMonthlyExpensesList(data);
            }
        }
        fetchItem();
    }
    , []);

    return (
        // 選択したカテゴリの支出・収入リストを表示
        <div className="bg-gray-100">
            <div className="max-w-md mx-auto bg-white shadow-md overflow-hidden">
                <Header />
                <div className="max-w-[27rem] mx-auto space-y-2">
                    <div className="p-4 border-b bg-gray-50">
                        <div className="space-y-1">
                            <Bar
                                data={{
                                    labels: monthlyExpensesList.map(item =>
                                        new Date(item.month).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' })
                                    ),
                                    datasets: [{
                                        label: '支出額',
                                        data: monthlyExpensesList.map(item => item.total_amount),
                                        backgroundColor: '#FF6384',
                                        borderColor: '#FF6384',
                                        // borderWidth: 1
                                    }]
                                }}
                            />

                            {fetchItem.data.map((item) => (
                                <div key={item.id} onClick={() => navigate(`/item-registry/${item.id}`)} className="flex items-center justify-between p-2 border-b">
                                    <div className="flex items-center">
                                        <div className="text-lg font-semibold">{item.outgo_categories.outgo_category_name}</div>
                                    </div>
                                    <div className="text-gray-500">{item.amount}円</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CategoryKakeiboList;