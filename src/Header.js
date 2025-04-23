import { useState } from "react";
import { NavLink, Form } from "react-router-dom";

function Header() {
    const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

    const toggleHamburger = () => { setIsHamburgerOpen(!isHamburgerOpen); };

    return (
    // ヘッダー
    <div className='bg-yellow-600 text-white p-4'>
        <div className="flex justify-between items-center">
            <button onClick={toggleHamburger} className='text-2xl focus:outline-none'>☰</button>
            <div className='text-lg font-smibold'>収支登録</div>
        </div>

        {/* ハンバーガーメニューの展開部分 */}
        { isHamburgerOpen && (
            <div className='mt-2 bg-yellow-500 rounded p-2 shadow'>
                {/* <nav className='flex flex-col p-4'> */}
                <ul className="space-y-2">
                    <li>
                        <NavLink to="/" className='block px-2 py-1 hover:bg-yellow-400 rounded'>ホーム</NavLink>
                    </li>
                    <li>
                        <NavLink to="/item-registry" className='block px-2 py-1 hover:bg-yellow-400 rounded'>収支登録</NavLink>
                    </li>
                    <li>
                        <NavLink to="/item-history" className='block px-2 py-1 hover:bg-yellow-400 rounded'>収支履歴</NavLink>
                    </li>
                    {/* <NavLink to="/" className='py-2 hover:bg-yellow-200'>ホーム</NavLink>
                    <NavLink to="/item-history" className='py-2 hover:bg-yellow-200'>収支履歴</NavLink>
                    <Form method="post" action="/logout">
                        <button type="submit" className='py-2 hover:bg-yellow-200'>ログアウト</button>
                    </Form> */}
                </ul>
            </div>
        )}
    </div>
    );
}

export default Header;