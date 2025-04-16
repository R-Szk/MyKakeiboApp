import Header from "../Header";

function KakeiboList() {
    return (
        <div className="bg-gray-100">
            <div className="max-w-md mx-auto bg-white shadow-md overflow-hidden">
                <Header />
                <div className="p-4">
                    {/* <h1 className="text-2xl font-bold mb-4">家計簿一覧</h1> */}
                    <h1 className="text-2xl font-bold mb-4">家計簿一覧</h1>
                    {/* <KakeiboList /> */}
                    {/* ここに家計簿のリストを表示 */}
                </div>
            </div>
        </div>
    );
}

export default KakeiboList;