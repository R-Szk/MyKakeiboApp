import Header from './Header';

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArcElement, Legend, Tooltip, Chart as chartJs } from 'chart.js';
import { Pie as ChartPie } from 'react-chartjs-2';
import { format, startOfMonth, endOfMonth } from 'date-fns';

import { useFetchData } from './Supabase/useFetchData';

chartJs.register(ArcElement, Tooltip, Legend);
chartJs.overrides.pie.plugins.legend.position = 'right';

function Home() {
    const currentMonth = format(new Date(), 'yyyy年M月');   // 現在の年月
    const navigate = useNavigate();
    // const totalAssets = 12345678; // 総資産

    
    // 総資産を取得
    const totalAssets = useFetchData(
        'account_balances',
        'balance.sum()'
    );

    const totalAssetsView = totalAssets.data?.[0]?.sum ?? 0;

    // 直近5件の支出を取得
    const expenseItems = useFetchData(
        'income_outgo_items',
        '*, outgo_categories(outgo_category_name)',
        [
            { column: 'is_outgo', value: true, operator: 'eq' },
        ],
        5,
        { column: 'transaction_date', ascending: false}
    );

    // 各カテゴリの支出額を取得（現在の月の支出分のみ）
    const expenditureEachCategory = useFetchData(
        'income_outgo_items',
        'outgo_category_id, outgo_categories(outgo_category_name), amount.sum()',
        [
            { column: 'is_outgo', value: true, operator: 'eq' },
            { column: 'transaction_date', value: format(startOfMonth(new Date()), 'yyyy-MM-dd'), operator: 'gte' },
            { column: 'transaction_date', value: format(endOfMonth(new Date()), 'yyyy-MM-dd'), operator: 'lte' }
        ]);

    // 各カテゴリの収入額を取得（当月の収入分のみ）
    const incomeEachCategory = useFetchData(
        'income_outgo_items',
        'income_category_id, income_categories(income_category_name), amount.sum()',
        [
            { column: 'is_outgo', value: false, operator: 'eq' },
            { column: 'transaction_date', value: format(startOfMonth(new Date()), 'yyyy-MM-dd'), operator: 'gte' },
            { column: 'transaction_date', value: format(endOfMonth(new Date()), 'yyyy-MM-dd'), operator: 'lte' }
        ]);

    // 当月の支出額、収入額を取得
    const totalExpenditure = expenditureEachCategory.data.reduce((acc, item) => acc + (item.sum || 0), 0);
    const totalIncome = incomeEachCategory.data.reduce((acc, item) => acc + (item.sum || 0), 0);
    
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
    <div className='bg-gray-100'>
        <div className='max-w-md mx-auto bg-white shadow-md overflow-hidden'>
            <Header />
            <div id='HomeView' className='max-w-[27rem] mx-auto space-y-2'>
                {/* 資産情報 */}
                <div className='p-4 border-b bg-gray-50'>
                    <p className='font-semibold'>現在の総資産</p>
                    <p className='text-3xl font-bold text-right'>{totalAssetsView.toLocaleString() || 0}円</p>
                </div>

                {/* 収支グラフ */}
                <div className='p-4 border-b bg-gray-50'>
                    <p className='font-semibold'>{currentMonth}の収支</p>
                    <div className='flex items-center'>
                        <div style={{ width: 220, height: 200}}>
                            {/* 支出の記録が無い場合は円グラフを非表示にする */}
                            {expenditureEachCategory.data.length > 0 ? (
                                <ChartPie data={pieData} options={pieOptions}/>
                            ): (
                                <div className='flex items-center justify-center h-full'>
                                    <p className='text-gray-500 text-sm text-center'>データがありません</p>
                                </div>
                            )}
                        </div>
                        <div className='space-y-2'>
                            <div>
                                <p className='text-gray-800'>収入</p>
                                <p className='text-2xl font-bold text-blue-600'>{totalIncome.toLocaleString()}円</p>
                            </div>
                            <div>
                                <p className='text-gray-800'>支出</p>
                                <p className='text-2xl font-bold text-red-600'>{totalExpenditure.toLocaleString()}円</p>
                            </div>
                            <div>
                                <p className='text-gray-800'>収支</p>
                                <p className='text-2xl font-bold'>{(totalIncome - totalExpenditure).toLocaleString()}円</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 最近の支出 */}
                <div className='p-4 border-b bg-gray-50'>
                    <p className='font-semibold'>最近の支出5件</p>
                    <div className='space-y-1'>
                        {expenseItems.data.map((expense, index) => (
                            <div key={index} onClick={() => navigate("/edit/${expense.id}")} className='flex items-center justify-between p-2 border-b'>
                                {/* <span className='text-2xl'>{expense.icon}</span> */}
                                <span className='flex-1 ml-2'>{expense.outgo_categories.outgo_category_name}</span>
                                <span className={`${expense.color} font-bold`}>{expense.amount.toLocaleString()}円</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 追加ボタン */}
                <button 
                    className='fixed bottom-6 right-6 bg-yellow-600 text-white w-16 h-16 rounded-full text-4xl shadow-lg'
                    onClick={() => navigate("/item-registry")}>
                    +
                </button>
            </div>
        </div>
    </div>

  );

}

export default Home;