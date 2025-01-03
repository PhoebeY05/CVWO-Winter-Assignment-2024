class Api::V1::SessionsController < ApplicationController
  # POST /api/v1/sessions/create
  def create
    user = User.find_by(username: params[:username])
    if user.present? && user.authenticate(params[:password])
      session[:user_id] = user.id
      render json: user
    else
      render json: { message: user }
    end
  end

  # DELETE /api/v1/sessions/destroy
  def destroy
    session.delete("user_id")
    render json: { message: "Signed out!" }
  end
end
