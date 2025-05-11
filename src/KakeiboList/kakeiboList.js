import Header from "../Header";

import { useNavigate } from "react-router-dom";
import { ArcElement, Legend, Tooltip, Chart as chartJs } from "chart.js";
import { Pie as ChartPie } from "react-chartjs-2";
import { format, startOfMonth, endOfMonth, isSameMonth, subMonths, addMonths } from "date-fns";

import useFetchData from "../Supabase/useFetchData";
import { useEffect, useState } from "react";
import { supabase } from "../Supabase/supabaseClient";

chartJs.register(ArcElement, Tooltip, Legend);
chartJs.overrides.pie.plugins.legend.position = "right";

function KakeiboList() {
    const [displayDay, setDisplayDay] = useState(new Date()); // 支出・収入を取得するための日付。デフォルトでは現在の日付を使用
    const navigate = useNavigate();

    const [expenditureEachCategory, setExpenditureEachCategory] = useState([]);

    const isThisMonth = isSameMonth(displayDay, new Date());

    // カテゴリ毎の支出額を取得（画面を開いた時は現在の月の支出分のみ）
    useEffect(() => {
        const fetchItem = async () => {
            const { data, error } = await supabase.rpc('get_outgo_summary_by_category', {
                start_date: format(startOfMonth(displayDay), 'yyyy-MM-dd'),
                end_date: format(endOfMonth(displayDay), 'yyyy-MM-dd'),
            });

            if (error) {
                console.error('Error fetching item:', error);
            } else if(data) {
                setExpenditureEachCategory(data);
                console.log('Fetched item:', data);
            }
        }
        fetchItem();
    }, [displayDay]);

    // 円グラフの表示設定(データや色など)
    const sortedExpenditure = expenditureEachCategory.sort((a, b) => b.sum - a.sum);
    const pieData = {
        labels: expenditureEachCategory.map(item => item.outgo_category_name || '未分類'),
        datasets: [
            {
                data: sortedExpenditure.map(item => item.total_amount),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FF6384', '#36A2EB'],
            },
        ]
    };

    // 円グラフのオプション設定
    const pieOptions = {
        radius: '90%',
        plugins: {
            legend: {
                display: false
            }
        }
    };

    return (
        <div className="bg-gray-100">
            <div className="max-w-md mx-auto bg-white shadow-md overflow-hidden">
                <Header />
                <div className="max-w-[27rem] mx-auto space-y-2">
                    {/* 収支グラフ */}
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <button onClick={() => setDisplayDay(subMonths(displayDay, 1))} className="text-gray-500 hover:text-gray-700 disabled:opacity-50">
                            &lt;
                        </button>
                        <p className="font-semibold">{format(displayDay, 'yyyy年M月')}</p>
                        { isThisMonth ? (
                            <span className="w-6" />
                        ) : (
                            <button onClick={() => setDisplayDay(addMonths(displayDay, 1))} className="text-gray-500 hover:text-gray-700">
                                &gt;
                            </button>
                        )}
                    </div>
                    <div className="flex items-center justify-center">
                        {/* 収支の記録が無い場合は円グラフを非表示にする */}
                        <div style={{ width: 220, height: 220 }}>
                            {expenditureEachCategory.length > 0 ? (
                                <ChartPie data={pieData} options={pieOptions} />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500 text-sm text-center">データがありません</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 支出リスト */}
                    <div className="p-4 border-b bg-gray-50">
                        <div className="overflow-y-auto max-h-96 space-y-1">
                            {expenditureEachCategory.map((item) => (
                                <div key={item.id} className="flex justify-between items-center border-b p-2">
                                    <p className="flex-1 ml-2">{item.outgo_category_name}</p>
                                    <p className={`${item.color} font-bold`}>{item.total_amount.toLocaleString()}円</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KakeiboList;