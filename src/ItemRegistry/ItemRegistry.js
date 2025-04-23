import Header from '../Header';

import { useState, useRef, useEffect, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import format from 'date-fns/format';
import ja from "date-fns/locale/ja";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from 'react-datepicker';

import { supabase } from '../Supabase/supabaseClient';
import { useFetchData } from '../Supabase/useFetchData';

// 選択肢において、画面外をクリックした場合に選択肢を閉じる
const useOutsideClick = (ref, callback) => {
  const handleClick = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [ref, callback]);
};

function ItemRegistry() {
  // 各入力フォームに選択する用のリストデータを取得
  const { data: incomeCategories } = useFetchData(  // 収入カテゴリの取得
    'income_categories',
    'income_category_id, income_category_name',
    [{ column: 'parent_income_category_id', value: null, operator: 'is'}]);
  const { data: outgoCategories } = useFetchData( // 支出カテゴリの取得
    'outgo_categories',
    'outgo_category_id, outgo_category_name',
    [{ column: 'parent_outgo_category_id', value: null, operator: 'is'}]);
  const { data: paymentMethods} = useFetchData( // 支出カテゴリの取得
    'payment_methods',
    'payment_method_id, payment_method_name');

  // 支出・収入タブの切り替えとカテゴリリストの切り替え
  const [activeTab, setActiveTab] = useState("支出"); // 支出・収入タブの切り替え用
  const selectableCatories = activeTab === "支出" ? outgoCategories : incomeCategories; // カテゴリフォームに表示するカテゴリリスト

  // 画面外をクリックした場合にカテゴリ選択リストを閉じる
  const [isCategoryOpen, setIsCategoryOpen] = useState(false); // カテゴリ選択用
  const [isOpen, setIsOpen] = useState(false);  // カレンダー開閉用
  const [isPaymentMethodOpen, setIsPaymentMethodOpen] = useState(false);  // 支払い方法選択リストの開閉用

  // フォームに送信する各種値のステート
  const [amount, setAmount] = useState("");  // 支出or収入の金額
  const [selectedCategory, setSelectedCategory] = useState(null); // 支出or収入のカテゴリ
  const [selectedDate, setSelectedDate] = useState(new Date()); // 支出or収入の日付
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null); // 支払い方法
  const [memo, setMemo] = useState("");  // メモ

  // ページ遷移用の関数
  const navigate = useNavigate();

  // URLパラメータからIDを取得
  const { itemId } = useParams();

  // 削除モーダルの開閉
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // アイテムの登録・編集用のURLパラメータがある場合は、データを取得してフォームにセット
  useEffect(() => {
    const fetchItem = async () => {
      const { data, error } = await supabase
        .from('income_outgo_items')
        .select('*, outgo_categories(outgo_category_name), income_categories(income_category_name), payment_methods(payment_method_name)')
        .eq('id', itemId)
        .single();
      
      if (error) {
        console.error(error);
      } else if (data) {
        setAmount(data.amount.toString());
        setActiveTab(data.is_outgo ? "支出" : "収入");
        setSelectedCategory(activeTab === "支出" ? data.outgo_categories.outgo_category_name : data.income_categories.income_category_name);
        setSelectedDate(new Date(data.transaction_date));
        setMemo(data.memo);
        setSelectedPaymentMethod(data.payment_methods.payment_method_name);
      }
    };

    fetchItem();
  }, [itemId, incomeCategories, outgoCategories, activeTab]);

  // カレンダーとカテゴリ、支払い方法のウィンドウの外側をクリックした場合に閉じる
  const datePickerRef = useRef(null);
  const calendarRef = useRef(null);
  const paymentMethodRef = useRef(null);
  useOutsideClick(datePickerRef, () => setIsOpen(false));
  useOutsideClick(calendarRef, () => setIsCategoryOpen(false));
  useOutsideClick(paymentMethodRef, () => setIsPaymentMethodOpen(false));

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setIsOpen(false); // 選択後にカレンダーを閉じる
  }

  const formatCurrency = (value) => {
    // 数値以外を削除して、カンマを追加
    const numericValue = value.replace(/\D/g, "");
    return new Intl.NumberFormat("ja-JP").format(numericValue);
  };

  // 登録ボタンを押した際の処理（入力チェック、データ登録）
  const handleRegister = async () => {
    // 入力チェック
    if (!amount || !selectedCategory || !selectedPaymentMethod) {
      alert("金額とカテゴリは必須です");
      return;
    }

    // 金額を数値に変換（カンマを削除）
    const amountNumber = parseInt(amount.replace(/,/g, ""), 10);

    // 金額が0以下の場合はエラー
    if (amountNumber <= 0) {
      alert("金額は1円以上で入力にしてください");
      return;
    }

    // カテゴリIDと支払い方法IDの取得
    const categoryId = selectableCatories.find((category) =>
        category[activeTab === "支出" ? "outgo_category_name" : "income_category_name"] === selectedCategory)[activeTab === "支出" ? "outgo_category_id" : "income_category_id"];
    const paymentMethodId = paymentMethods.find((method) => method.payment_method_name === selectedPaymentMethod).payment_method_id;

    // カテゴリまたは支払い方法が見つからない場合はエラー
    if(!categoryId || !paymentMethodId) {
      alert("カテゴリまたは支払い方法が見つかりません");
      return;
    }

    // Supabaseにデータを登録
    if(itemId) {
      // 編集の場合
      const { error } = await supabase
        .from('income_outgo_items')
        .update({
          amount: amountNumber,
          outgo_category_id: activeTab === "支出" ? categoryId : null,
          income_category_id: activeTab === "収入" ? categoryId : null,
          memo: memo,
          transaction_date: selectedDate.toISOString().split("T")[0],
          payment_method_id: paymentMethodId,
          is_outgo: activeTab === "支出",
        })
        .eq('id', itemId);
      if (error) {
        alert("データの更新に失敗しました");
      } else {
        navigate('/');  // トップページに遷移
      }
    } else {
      // 新規登録の場合
      const { error } = await supabase.from('income_outgo_items').insert([
        {
          amount: amountNumber,
          outgo_category_id: activeTab === "支出" ? categoryId : null,
          income_category_id: activeTab === "収入" ? categoryId : null,
          memo: memo,
          transaction_date: selectedDate.toISOString().split("T")[0],
          payment_method_id: paymentMethodId,
          is_outgo: activeTab === "支出",
        }
      ])

      if (error) {
        console.error('Error inserting data:', error.message);
        alert("データの登録に失敗しました");
        return;
      } else {
        navigate('/');  // トップページに遷移
      }
    }
  };

  //  削除処理
  const handleDelete = async () => {
    const { error } = await supabase
      .from('income_outgo_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting data:', error.message);
      alert("データの削除に失敗しました");
    } else {
      navigate('/');  // トップページに遷移
    }
  };

  return (
    <div className='bg-gray-100'>
      <div className='max-w-md mx-auto bg-white shadow-md overflow-hidden'>
        <Header />
        {/* <!-- タブ切り替え --> */}
        <div class="flex justify-center border-b relative">
          {["支出", "収入"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);  // 支出・収入タブの切り替え
                setSelectedCategory(null);  // 選択されているカテゴリをリセット
              }}
              className={`flex-1 py-2 text-center relative transition-all duration-300${
                activeTab === tab ? "text-black font-bold": "text-gray-500"
              }`}>
              {tab}
            </button>
          ))}
          <div className='absolute bottom-0 h-0.5 bg-yellow-600 transition-all duration-300' style={{ left: activeTab === "支出" ? "0%" : "50%", width: "50%"}} />
        </div>

        {/* 入力フォーム */}
        <div className='p-6 space-y-4'>
          {/* 支出or収入の金額 */}
          <div className='flex text-3xl font-bold text-right my-4'>
            <input
              type='text'
              placeholder='0'
              value={amount}
              onChange={(e) => setAmount(formatCurrency(e.target.value))}
              className='bg-transparent text-right w-full focus:outline-none' />円
          </div>

          {/* カテゴリの選択 */}
          <div className='relative' ref={calendarRef}>
            <div className='flex items-center justify-between p-3 border rounded' onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
              <div className='flex items-center space-x-2'>
                <span className='text-xl'>📁</span>
                <span>{selectedCategory ? selectedCategory : "カテゴリを選択"}</span>
              </div>
              <span className='text-gray-500'>▼</span>
            </div>
            {isCategoryOpen && (
              <div className='absolute left-0 w-full bg-white shadow-md rounded-md mt-1 max-h-40 overflow-y-auto z-10'>
                {selectableCatories.map((category) => (
                  <div
                    key={category[activeTab === "支出" ? "outgo_category_id" : "income_category_id"]}
                    className='p-2 hover:bg-gray-200 cursor-pointer'
                    onClick={() => {
                      setSelectedCategory(category[activeTab === "支出" ? "outgo_category_name" : "income_category_name"]);
                      setIsCategoryOpen(false);
                    }}>
                    {category[activeTab === "支出" ? "outgo_category_name" : "income_category_name"]}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 日付の選択 */}
          <div className='relative' ref={datePickerRef}>
            <div className='flex items-center justify-between p-3 border rounded' onClick={() => setIsOpen(!isOpen)}>
              <div className='flex'>
                <span className='mr-2 text-xl'>📅</span>
                <span className='flex-1'>{format(selectedDate, "yyyy年M月d日（E）", { locale: ja })}</span>
              </div>
            <span className='text-gray-500'>▼</span>
            </div>
            {isOpen && (
              <div className='absolute left-0 mt-2 z-10'>
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  inline
                  locale={ja}
                  dateFormat='yyyy/MM/dd' />
              </div>
            )}
          </div>

          {/* メモ */}
          <div class="flex items-center space-x-2 p-3 border rounded">
            <span className='text-gray-500 text-xl'>ℹ️</span>
            <input
              type="text"
              placeholder="内容を入力"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              class="w-full bg-transparent outline-none" />
          </div>

          {/* 支払い方法 */}
          <div className='relative' ref={paymentMethodRef}>
            <div className='flex items-center justify-between p-3 border rounded' onClick={() => setIsPaymentMethodOpen(!isPaymentMethodOpen)}>
              <div className='flex items-center space-x-2'>
                <span className='text-xl'>💰</span>
                <span>{selectedPaymentMethod ? selectedPaymentMethod : "支払い方法"}</span>
              </div>
              <span className='text-gray-500'>▼</span>
            </div>
            {isPaymentMethodOpen && (
              <div className='absolute left-0 w-full bg-white shadow-md rounded-md mt-1 max-h-40 overflow-y-auto z-10'>
                {paymentMethods.map((method) => (
                  <div
                    key={method.payment_method_id}
                    className='p-2 hover:bg-gray-200 cursor-pointer'
                    onClick={() => {
                      setSelectedPaymentMethod(method.payment_method_name);
                      setIsPaymentMethodOpen(false);
                    }}>
                    {method.payment_method_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ボタン */}
        <div class="p-6 space-y-2">
          <button class="w-full p-3 text-white bg-yellow-600 rounded-md font-bold" onClick={handleRegister}>{itemId ? "更新" : "登録"}</button>
          <button class="w-full p-1 text-white bg-blue-500 rounded-md" onClick={() => navigate('/')}>キャンセル</button>
          {itemId && (
            <>
              <button class="w-full p-1 text-white bg-red-500 rounded-md mt-2" onClick={() => setIsDeleteModalOpen(true)}>削除</button>
              {isDeleteModalOpen && (
                <div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
                  <div className='bg-white p-4 rounded-md shadow-md w-80'>
                    <h2 className='text-lg mb-4 text-center'>このデータを削除しますか？</h2>
                    <div className='flex justify-around'>
                      <button className='text-blue-500' onClick={() => setIsDeleteModalOpen(false)}>キャンセル</button>
                      <button className='text-red-500' onClick={handleDelete}>削除する</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
    </div>
  );

}

export default ItemRegistry;