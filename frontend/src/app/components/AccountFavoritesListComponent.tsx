//src/app/components/AccountFavoritesListComponent.tsx
import React from 'react';
import { FavoriteLocation } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';

interface AccountFavoritesListComponentProps {
  favorites: FavoriteLocation[];
  onRemoveFavorite: (id: string) => void;
}

export default function AccountFavoritesListComponent({
  favorites,
  onRemoveFavorite,
}: AccountFavoritesListComponentProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">{t('my_favorite_locations_title')}</h2>
      {favorites.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 italic text-center">{t('no_favorites_yet')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">{t('location_name_table_header')}</th>
                <th className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">{t('latitude_table_header')}</th>
                <th className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">{t('longitude_table_header')}</th>
                <th className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">{t('actions_table_header')}</th>
              </tr>
            </thead>
            <tbody>
              {favorites.map((fav) => (
                <tr
                  key={fav._id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {fav.country_code && (
                      <span className={`fi fi-${fav.country_code.toLowerCase()} mr-2 rounded`}></span>
                    )}
                    {fav.location_name}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{fav.latitude.toFixed(4)}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{fav.longitude.toFixed(4)}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onRemoveFavorite(fav._id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors"
                    >
                      {t('remove_button')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}