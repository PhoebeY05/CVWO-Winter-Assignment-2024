class CreateComments < ActiveRecord::Migration[8.0]
  def change
    create_table :comments do |t|
      t.text :body
      t.integer :post_id
      t.integer :parent_id

      t.timestamps
    end
  end
end
