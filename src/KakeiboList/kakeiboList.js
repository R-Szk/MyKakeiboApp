import Header from "../Header";

import { useNavigate } from "react-router-dom";
import { ArcElement, Legend, Tooltip, Chart as chartJs } from "chart.js";
import { Pie as ChartPie } from "react-chartjs-2";
import { format, startOfMonth, endOfMonth } from "date-fns";

import useFetchData from "../Supabase/useFetchData";

chartJs.register(ArcElement, Tooltip, Legend);
chartJs.overrides.pie.plugins.legend.position = "right";

function KakeiboList() {
    const currentMonth = format(new Date(), 'yyyy年M月');   // 現在の年月
    const navigate = useNavigate();

    // 各カテゴリの支出額を取得（現在の月の支出分のみ）
    const expenditureEachCategory = useFetchData(
        'income_outgo_items',
        'outgo_category_id, outgo_categories(outgo_category_name), amount.sum()',
        [
            { column: 'is_outgo', value: true, operator: 'eq' },
            { column: 'transaction_date', value: format(startOfMonth(new Date()), 'yyyy-MM-dd'), operator: 'gte' },
            { column: 'transaction_date', value: format(endOfMonth(new Date()), 'yyyy-MM-dd'), operator: 'lte' }
        ]);

    // 円グラフの表示設定(データや色など)
    const sortedExpenditure = expenditureEachCategory.data.sort((a, b) => b.sum - a.sum);
    const pieData = {
        labels: expenditureEachCategory.data.map(item => item.outgo_categories?.outgo_category_name || '未分類'),
        datasets: [
            {
                // data: expenditureEachCategory.data.map(item => item.sum),
                data: sortedExpenditure.map(item => item.sum),
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
                    <div className="p-4 border-b bg-gray-50">
                        <p className="flex justify-center font-semibold">{currentMonth}</p>
                        <div className="flex items-center justify-center">
                            {/* 収支の記録が無い場合は円グラフを非表示にする */}
                            <div style={{ width: 220, height: 220 }}>
                                {expenditureEachCategory.data.length > 0 ? (
                                    <ChartPie data={pieData} options={pieOptions} />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-gray-500 text-sm text-center">データがありません</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KakeiboList;