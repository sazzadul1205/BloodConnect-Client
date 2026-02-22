
const ResultsCount = ({ filteredUsers, itemsPerPage, setItemsPerPage, startIndex, endIndex, setCurrentPage }) => {
  return (
    <div className="flex justify-between items-center">
      <p className="text-sm text-base-content/70">
        Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
        <span className="font-semibold">{Math.min(endIndex, filteredUsers.length)}</span> of{" "}
        <span className="font-semibold">{filteredUsers.length}</span> users
      </p>

      {/* Items per page */}
      <select
        className="select select-bordered select-sm w-24"
        value={itemsPerPage}
        onChange={(e) => {
          setItemsPerPage(Number(e.target.value));
          setCurrentPage(1);
        }}
      >
        <option value={5}>5 / page</option>
        <option value={10}>10 / page</option>
        <option value={20}>20 / page</option>
        <option value={50}>50 / page</option>
      </select>
    </div>
  );
};

export default ResultsCount;